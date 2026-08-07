"use client";

import React, { useState } from "react";
import { DailyLog } from "@/lib/schema";
import {
  Calendar,
  Users,
  Sun,
  AlertTriangle,
  Camera,
  IndianRupee,
  MessageSquare,
  Sparkles,
  Plus,
  CheckCircle2,
  Package,
  Clock,
  ChevronRight,
  Send,
  UserCheck
} from "lucide-react";

interface DailySiteReportTabProps {
  dailyLogs: DailyLog[];
  isClient: boolean;
  onAddDailyLog: (newLog: Partial<DailyLog>) => Promise<void>;
  onAddCustomerRemark: (logId: string, remark: string) => Promise<void>;
}

export default function DailySiteReportTab({
  dailyLogs,
  isClient,
  onAddDailyLog,
  onAddCustomerRemark,
}: DailySiteReportTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    dailyLogs.length > 0 ? dailyLogs[0].id : null
  );

  // Form states for contractor creation
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [workersCount, setWorkersCount] = useState(4);
  const [hoursWorked, setHoursWorked] = useState(8);
  const [weatherInput, setWeatherInput] = useState("Sunny (30°C)");
  const [workCompletedText, setWorkCompletedText] = useState(
    "1. Completed conduit piping for kitchen switchboard\n2. Fixed junction boxes in living area\n3. Checked voltage distribution"
  );
  const [materialsUsedText, setMaterialsUsedText] = useState(
    "Wires (100m), PVC Conduits (15 units), Junction Boxes (8 units)"
  );
  const [problemsInput, setProblemsInput] = useState("Minor delay in material delivery from supplier.");
  const [expensesInput, setExpensesInput] = useState<number>(4500);
  const [proRemarksInput, setProRemarksInput] = useState(
    "Work progressing smoothly according to safety guidelines."
  );
  const [customerRemarkText, setCustomerRemarkText] = useState("");

  const selectedLog = dailyLogs.find((l) => l.id === selectedLogId) || dailyLogs[0];

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const workList = workCompletedText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedMaterials = materialsUsedText
        .split(",")
        .map((item) => {
          const trimmed = item.trim();
          return { itemName: trimmed, quantity: 1 };
        })
        .filter((m) => m.itemName.length > 0);

      // Generate instant AI Summary
      const aiSummary = `Daily Site Insights (${logDate}): Execution completed by ${workersCount} team members over ${hoursWorked} working hours. Highlights include: ${workList.slice(0, 2).join("; ")}. Overall conditions were ${weatherInput}. Total daily site expenditure recorded at ₹${expensesInput.toLocaleString("en-IN")}.`;

      const newLogData: Partial<DailyLog> = {
        date: logDate,
        workersPresent: Number(workersCount),
        hoursWorked: Number(hoursWorked),
        weather: weatherInput,
        workSummary: workList,
        workCompletedList: workList,
        materialsUsed: parsedMaterials,
        issues: problemsInput.trim(),
        expensesAmount: Number(expensesInput),
        proRemarks: proRemarksInput.trim(),
        aiSummary,
        createdAt: new Date().toISOString(),
      };

      await onAddDailyLog(newLogData);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating daily log:", err);
      alert("Failed to submit daily report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerRemarkSubmit = async (logId: string) => {
    if (!customerRemarkText.trim()) return;
    try {
      await onAddCustomerRemark(logId, customerRemarkText.trim());
      setCustomerRemarkText("");
    } catch (err) {
      console.error("Error submitting remark:", err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-indigo-400/30">
              📖 CONSTRUCTION DIARY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {dailyLogs.length} Daily Reports Filed
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Daily Site Reports & Construction Logs
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Complete daily audit of site progress, worker count, material consumption, and AI daily summaries.
          </p>
        </div>

        {!isClient && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? "Cancel Form" : "New Daily Site Report"}</span>
          </button>
        )}
      </div>

      {/* NEW DAILY LOG FORM (CONTRACTOR) */}
      {showAddForm && !isClient && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border-2 border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Submit Construction Diary Entry
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Report Date *</label>
              <input
                type="date"
                required
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Workers Present *</label>
              <input
                type="number"
                required
                min={1}
                value={workersCount}
                onChange={(e) => setWorkersCount(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Hours Worked *</label>
              <input
                type="number"
                required
                min={1}
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Weather Conditions</label>
              <input
                type="text"
                value={weatherInput}
                onChange={(e) => setWeatherInput(e.target.value)}
                placeholder="e.g. Sunny (30°C)"
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Work Completed (1 per line)</label>
              <textarea
                rows={4}
                required
                value={workCompletedText}
                onChange={(e) => setWorkCompletedText(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Materials Used Today</label>
              <textarea
                rows={4}
                value={materialsUsedText}
                onChange={(e) => setMaterialsUsedText(e.target.value)}
                placeholder="e.g. Cement (5 bags), Sand (1 ton)"
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Problems / Blockers</label>
              <input
                type="text"
                value={problemsInput}
                onChange={(e) => setProblemsInput(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Daily Expenses (₹)</label>
              <input
                type="number"
                value={expensesInput}
                onChange={(e) => setExpensesInput(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Professional Remarks</label>
              <input
                type="text"
                value={proRemarksInput}
                onChange={(e) => setProRemarksInput(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase rounded-lg shadow-md cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? "Publishing..." : "Generate AI Summary & Publish"}</span>
            </button>
          </div>
        </form>
      )}

      {/* DIARY LIST & SINGLE ENTRY VIEW */}
      {dailyLogs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Construction Reports Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Daily logs submitted by the contractor will appear here like an automated construction diary.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Date Selector List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Select Date Log
            </h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {dailyLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-white text-slate-900 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block">
                        {log.date
                          ? new Date(log.date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Daily Log"}
                      </span>
                      <span
                        className={`text-[10px] font-bold block mt-0.5 ${
                          isSelected ? "text-indigo-200" : "text-slate-500"
                        }`}
                      >
                        {log.workersPresent || 4} Workers • {log.hoursWorked || 8} Hours
                      </span>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Construction Diary Card */}
          {selectedLog && (
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Card Title */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded">
                    Construction Diary Entry
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Report for{" "}
                    {selectedLog.date
                      ? new Date(selectedLog.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Today"}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{selectedLog.weather || "Sunny (32°C)"}</span>
                </div>
              </div>

              {/* AI Automated Summary Banner */}
              {selectedLog.aiSummary && (
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-xl space-y-1.5 shadow-xs border border-indigo-800">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>AI Daily Summary</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {selectedLog.aiSummary}
                  </p>
                </div>
              )}

              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Workers</span>
                  <span className="text-base font-black font-mono text-slate-900 flex items-center gap-1 mt-0.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    {selectedLog.workersPresent || 4} Present
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hours</span>
                  <span className="text-base font-black font-mono text-slate-900 flex items-center gap-1 mt-0.5">
                    <Clock className="w-4 h-4 text-sky-600" />
                    {selectedLog.hoursWorked || 8} Hours
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Daily Cost</span>
                  <span className="text-base font-black font-mono text-emerald-600 mt-0.5 block">
                    ₹{(selectedLog.expensesAmount || 4500).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Weather</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block truncate">
                    {selectedLog.weather || "Sunny"}
                  </span>
                </div>
              </div>

              {/* Work Completed Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Work Completed Today
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  {(selectedLog.workCompletedList || selectedLog.workSummary || []).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-800">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials Used */}
              {selectedLog.materialsUsed && selectedLog.materialsUsed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" /> Materials Consumed
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.materialsUsed.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {m.itemName}: <strong>{m.quantity}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Problems / Issues Reported */}
              {selectedLog.issues && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-black text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Site Issues / Problems
                  </span>
                  <p className="text-xs text-rose-900 font-medium">{selectedLog.issues}</p>
                </div>
              )}

              {/* Professional & Customer Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-extrabold text-slate-700 block">Professional Remarks</span>
                  <p className="text-xs text-slate-600 font-medium">
                    {selectedLog.proRemarks || selectedLog.supervisorNotes || "No specific contractor remarks."}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-extrabold text-slate-700 block">Customer Remarks</span>
                  <p className="text-xs text-slate-600 font-medium">
                    {selectedLog.customerRemarks || "No customer feedback added yet."}
                  </p>

                  {isClient && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        value={customerRemarkText}
                        onChange={(e) => setCustomerRemarkText(e.target.value)}
                        placeholder="Add customer remark..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCustomerRemarkSubmit(selectedLog.id)}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-700"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
