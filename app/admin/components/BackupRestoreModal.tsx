"use client";

import React from "react";
import {
  RefreshCw,
  CheckCircle,
  X,
  AlertTriangle,
  Database,
  Calendar,
  FileText,
  Briefcase,
  Users,
  Award,
  ShieldCheck,
  Zap,
  Download,
  Flame
} from "lucide-react";

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectSummary: any;
  isRestoring: boolean;
  restoreProgressStatus: string;
  restorePercent: number;
  cleanWipeMode: boolean;
  setCleanWipeMode: (val: boolean) => void;
  onConfirmRestore: () => void;
}

export default function BackupRestoreModal({
  isOpen,
  onClose,
  inspectSummary,
  isRestoring,
  restoreProgressStatus,
  restorePercent,
  cleanWipeMode,
  setCleanWipeMode,
  onConfirmRestore,
}: BackupRestoreModalProps) {
  if (!isOpen || !inspectSummary) return null;

  const {
    version,
    exportedAt,
    exportedBy,
    totalRecords,
    counts = {},
    summary = {},
  } = inspectSummary;

  const meetingsCount = summary.meetingsCount || counts["meetings"] || 0;
  const quotationsCount = summary.quotationsCount || counts["quotations"] || 0;
  const bookingsCount = summary.bookingsCount || counts["bookings"] || 0;
  const projectsCount = summary.projectsCount || counts["projects"] || 0;
  const milestonesCount = summary.milestonesCount || counts["milestones"] || 0;
  const workersCount = summary.workersCount || counts["workers"] || 0;
  const usersCount = summary.usersCount || counts["users"] || 0;
  const rentalsCount = summary.rentalsCount || counts["rentals"] || 0;
  const shopOrdersCount = summary.shopOrdersCount || counts["shopOrders"] || 0;
  const inquiriesCount = summary.inquiriesCount || counts["inquiries"] || 0;
  const agreementsCount = summary.agreementsCount || counts["agreements"] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[12px] shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                Verify & Restore Master Backup Snapshot
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Comprehensive Database Recovery Console
              </p>
            </div>
          </div>

          {!isRestoring && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Active Progress Overlay if Restoring */}
          {isRestoring ? (
            <div className="py-12 px-6 bg-slate-50 border border-indigo-100 rounded-[10px] text-center space-y-5 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-lg">
                  Restoring System Snapshot...
                </h4>
                <p className="text-xs text-slate-600 font-semibold max-w-md mx-auto">
                  {restoreProgressStatus || "Applying database payload and setting records..."}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md mx-auto space-y-1.5">
                <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-300">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${restorePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-500">
                  <span>Progress</span>
                  <span>{restorePercent}%</span>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 py-2 px-4 rounded-md inline-block">
                Please keep this page open until restoration completes.
              </p>
            </div>
          ) : (
            <>
              {/* Snapshot Meta Information Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-[8px] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Total Records
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">
                    {totalRecords.toLocaleString()} Docs
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Backup Version
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                    {version}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Export Date
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                    {new Date(exportedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                    Exported By
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                    {exportedBy}
                  </span>
                </div>
              </div>

              {/* Comprehensive Data Category Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Recovery Payload Breakdown
                  </h4>
                  <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {Object.keys(counts).length} Collections Detected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Meetings
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {meetingsCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Quotations
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {quotationsCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Bookings & Orders
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {bookingsCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Projects & Stages
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {projectsCount} ({milestonesCount} stages)
                      </span>
                    </div>
                  </div>

                  <div className="bg-violet-50/50 border border-violet-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Professionals
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {workersCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-sky-50/50 border border-sky-100 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Customers & Users
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {usersCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Inquiries & Agreements
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {inquiriesCount + agreementsCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Rentals & Products
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {rentalsCount + shopOrdersCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-100 border border-slate-200 rounded-[6px] p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        Other System Collections
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {Math.max(0, Object.keys(counts).length - 8)} Tables
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Collection Breakdown Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-[8px] overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs font-extrabold text-slate-700">
                  <span>Collection Name</span>
                  <span>Document Count</span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-200 text-xs font-semibold text-slate-800">
                  {Object.entries(counts).map(([cName, cCount]) => (
                    <div key={cName} className="px-4 py-2 flex justify-between items-center hover:bg-white transition">
                      <span className="font-mono text-slate-900">{cName}</span>
                      <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-xs font-bold text-slate-700 text-[11px]">
                        {Number(cCount).toLocaleString()} docs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restore Mode Option Selector */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-[8px] p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                  <span>RECOVERY EXECUTION MODE</span>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-amber-100/50 transition">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={!cleanWipeMode}
                      onChange={() => setCleanWipeMode(false)}
                      className="w-4 h-4 text-indigo-600 accent-indigo-600"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 block">
                        Merge & Overwrite (Recommended)
                      </span>
                      <span className="text-[11px] text-slate-600 block">
                        Overwrites matching document IDs and inserts new records without deleting unmentioned data.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-amber-100/50 transition">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={cleanWipeMode}
                      onChange={() => setCleanWipeMode(true)}
                      className="w-4 h-4 text-rose-600 accent-rose-600"
                    />
                    <div>
                      <span className="font-extrabold text-rose-900 block">
                        Clean Wipe & Complete Restore
                      </span>
                      <span className="text-[11px] text-rose-700 block">
                        Wipes existing database collections before restoring snapshot so state is 100% identical.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Actions Footer */}
        {!isRestoring && (
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-[6px] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={onConfirmRestore}
              className={`px-6 py-2.5 font-extrabold text-xs uppercase tracking-wider text-white rounded-[6px] transition cursor-pointer border-none shadow-subtle flex items-center gap-2 ${
                cleanWipeMode
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {cleanWipeMode ? "APPLY CLEAN RESTORE" : "START DATABASE RESTORE"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
