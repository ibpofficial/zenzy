"use client";

import React, { useState } from "react";
import { ProjectIssue, ProjectChangeRequest } from "@/lib/schema";
import {
  AlertTriangle,
  FileEdit,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  X,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

interface IssuesAndChangesTabProps {
  issues: ProjectIssue[];
  changeRequests: ProjectChangeRequest[];
  isClient: boolean;
  onRespondIssue: (issue: ProjectIssue, status: "accepted" | "rejected" | "resolved", responseNotes?: string) => void;
  onRespondChangeRequest: (changeReq: ProjectChangeRequest, status: "approved" | "rejected") => void;
  onCreateIssue: (title: string, description: string, effectDays: number, extraCost: number) => void;
  onCreateChangeRequest: (title: string, description: string, extraCost: number, extraTimeDays: number) => void;
}

export default function IssuesAndChangesTab({
  issues,
  changeRequests,
  isClient,
  onRespondIssue,
  onRespondChangeRequest,
  onCreateIssue,
  onCreateChangeRequest,
}: IssuesAndChangesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"issues" | "change_requests">("change_requests");

  // Create Issue Form State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueEffectDays, setIssueEffectDays] = useState(2);
  const [issueExtraCost, setIssueExtraCost] = useState(0);

  // Create Change Request Form State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [crTitle, setCrTitle] = useState("");
  const [crDesc, setCrDesc] = useState("");
  const [crCost, setCrCost] = useState(24000);
  const [crDays, setCrDays] = useState(4);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;
    onCreateIssue(issueTitle.trim(), issueDesc.trim(), Number(issueEffectDays), Number(issueExtraCost));
    setIssueTitle("");
    setIssueDesc("");
    setShowIssueModal(false);
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crTitle.trim()) return;
    onCreateChangeRequest(crTitle.trim(), crDesc.trim(), Number(crCost), Number(crDays));
    setCrTitle("");
    setCrDesc("");
    setShowChangeModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Sub-Tab Switcher */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab("change_requests")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                activeSubTab === "change_requests"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              Change Requests ({changeRequests.length})
            </button>
            <button
              onClick={() => setActiveSubTab("issues")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                activeSubTab === "issues"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              }`}
            >
              Issue Tracking ({issues.length})
            </button>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold pt-1">
            {activeSubTab === "change_requests"
              ? "Formal variation workflow for additional customer requests (e.g. False Ceiling, Tiles)."
              : "Track delays, layout revisions, site impediments, and dispute resolutions."}
          </p>
        </div>

        <button
          onClick={() => (activeSubTab === "change_requests" ? setShowChangeModal(true) : setShowIssueModal(true))}
          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-lg transition cursor-pointer border-none flex items-center gap-2 shadow-subtle shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === "change_requests" ? "New Change Request" : "Log Site Issue"}</span>
        </button>
      </div>

      {/* SUB-TAB 1: CHANGE REQUESTS WORKFLOW */}
      {activeSubTab === "change_requests" && (
        <div className="space-y-4">
          {changeRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileEdit className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase">No Change Requests Recorded</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-semibold">
                When customers request additional work (e.g. False Ceiling, extra lighting), submit a Change Request to update budget & timeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {changeRequests.map((cr) => {
                const isPending = cr.status === "pending";

                return (
                  <div key={cr.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-subtle">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="bg-purple-100 text-purple-700 font-mono font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md">
                          Scope Change Request
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1">{cr.title}</h4>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          cr.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : cr.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {cr.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{cr.description}</p>

                    {/* Impact Metric Cards */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-semibold">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block font-bold">Extra Cost</span>
                          <span className="font-black text-sm text-slate-900">+₹{cr.extraCost.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-amber-800">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <div>
                          <span className="text-[10px] uppercase text-slate-400 block font-bold">Extra Time</span>
                          <span className="font-black text-sm text-slate-900">+{cr.extraTimeDays} Days</span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Action Bar */}
                    {isPending && isClient && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onRespondChangeRequest(cr, "approved")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve & Update Schedule</span>
                        </button>

                        <button
                          onClick={() => onRespondChangeRequest(cr, "rejected")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ISSUE TRACKING */}
      {activeSubTab === "issues" && (
        <div className="space-y-4">
          {issues.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm uppercase">No Site Issues Reported</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-semibold">
                Document layout changes, structural impediments, or material delivery delays to maintain complete accountability.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {issues.map((iss) => {
                const isPending = iss.status === "pending";

                return (
                  <div key={iss.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-subtle">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="bg-amber-100 text-amber-800 font-mono font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md">
                          Site Issue Report
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1">{iss.title}</h4>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          iss.status === "accepted" || iss.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : iss.status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {iss.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{iss.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-lg border">
                      {iss.effectDays ? <span>⏱ Effect: +{iss.effectDays} Days</span> : null}
                      {iss.extraCost ? <span>💰 Cost Impact: +₹{iss.extraCost.toLocaleString()}</span> : null}
                      <span>Reported By: {iss.reportedByName || iss.reportedByRole}</span>
                    </div>

                    {isPending && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onRespondIssue(iss, "accepted")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept & Resolve</span>
                        </button>
                        <button
                          onClick={() => onRespondIssue(iss, "rejected")}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE CHANGE REQUEST MODAL */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase">Submit Formal Change Request</h4>
              <button onClick={() => setShowChangeModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Change Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add False Ceiling in Kitchen"
                  value={crTitle}
                  onChange={(e) => setCrTitle(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Detailed Specification</label>
                <textarea
                  rows={2}
                  placeholder="Gypsum false ceiling with LED cove lighting strip..."
                  value={crDesc}
                  onChange={(e) => setCrDesc(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Extra Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={crCost}
                    onChange={(e) => setCrCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Extra Time (Days)</label>
                  <input
                    type="number"
                    required
                    value={crDays}
                    onChange={(e) => setCrDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-extrabold uppercase rounded-lg"
                >
                  Submit Change Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase">Report Site Issue / Delay</h4>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Issue Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer requested layout changes on light points"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Details</label>
                <textarea
                  rows={2}
                  placeholder="Wiring work paused waiting for customer light point confirmation..."
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Timeline Effect (Days)</label>
                  <input
                    type="number"
                    value={issueEffectDays}
                    onChange={(e) => setIssueEffectDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Cost Effect (₹)</label>
                  <input
                    type="number"
                    value={issueExtraCost}
                    onChange={(e) => setIssueExtraCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-extrabold uppercase rounded-lg"
                >
                  Log Site Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
