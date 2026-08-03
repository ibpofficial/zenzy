"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProWarrantyRecord, Project } from "@/lib/schema";
import { createWarrantyRecord } from "@/lib/proSuite";
import {
  ShieldCheck,
  Plus,
  AlertCircle,
  Calendar,
  Wrench,
  CheckCircle2,
  X,
  Clock,
  Briefcase
} from "lucide-react";

export default function ProWarrantyPage() {
  const { user } = useAuth();
  const [warranties, setWarranties] = useState<ProWarrantyRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [durationMonths, setDurationMonths] = useState("12");
  const [coverageTerms, setCoverageTerms] = useState(
    "12-month comprehensive warranty on civil structure, electrical fittings, and waterproofing."
  );
  const [submitting, setSubmitting] = useState(false);

  // Issue Modal State
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<ProWarrantyRecord | null>(null);
  const [issueDesc, setIssueDesc] = useState("");

  // Sync Warranties & Projects
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qWar = query(
      collection(db, "pro_warranties"),
      where("professionalId", "==", user.uid)
    );

    const unsubWar = onSnapshot(qWar, (snap) => {
      const list: ProWarrantyRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProWarrantyRecord));
      setWarranties(list);
      setLoading(false);
    });

    const qProj = query(
      collection(db, "projects"),
      where("businessId", "==", user.uid)
    );

    const unsubProj = onSnapshot(qProj, (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Project));
      setProjects(list);
    });

    return () => {
      unsubWar();
      unsubProj();
    };
  }, [user]);

  const handleIssueWarranty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProjectId) return;

    setSubmitting(true);
    try {
      const proj = projects.find((p) => p.id === selectedProjectId);
      const months = parseInt(durationMonths) || 12;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      await createWarrantyRecord({
        professionalId: user.uid,
        projectId: selectedProjectId,
        projectTitle: proj?.title || "Project Warranty",
        customerId: proj?.clientId || "cust_unknown",
        customerName: proj?.clientName || "Client",
        startDate: startDate.toISOString().split("T")[0],
        durationMonths: months,
        endDate: endDate.toISOString().split("T")[0],
        coverageTerms,
        issues: []
      });

      setModalOpen(false);
      setSelectedProjectId("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty || !issueDesc.trim()) return;

    try {
      const updatedIssues = [
        ...selectedWarranty.issues,
        {
          id: `issue_${Date.now()}`,
          description: issueDesc.trim(),
          reportedAt: new Date().toISOString(),
          status: "open" as const
        }
      ];

      await updateDoc(doc(db, "pro_warranties", selectedWarranty.id), {
        issues: updatedIssues
      });

      setIssueModalOpen(false);
      setIssueDesc("");
      setSelectedWarranty(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>Warranty Management Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Issue post-completion warranties, log customer complaints, and schedule resolution site visits
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Warranty Card</span>
        </button>
      </div>

      {/* Warranties Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading warranty records...</div>
      ) : warranties.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Active Warranties</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Issue digital warranty certificates to customers upon project completion to maintain trust.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {warranties.map((w) => (
            <div key={w.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{w.projectTitle}</h3>
                  <span className="text-xs text-slate-500">Client: {w.customerName}</span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase">
                  {w.durationMonths} Months Active
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="font-medium text-slate-800">Coverage Terms:</div>
                <p className="text-slate-500 text-[11px]">{w.coverageTerms}</p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Valid from {w.startDate} to {w.endDate}
                </div>
              </div>

              {/* Reported Issues */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Reported Issues ({w.issues?.length || 0})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWarranty(w);
                      setIssueModalOpen(true);
                    }}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    + Report Claim
                  </button>
                </div>

                {w.issues && w.issues.length > 0 ? (
                  <div className="space-y-1.5">
                    {w.issues.map((issue) => (
                      <div key={issue.id} className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{issue.description}</div>
                          <span className="text-[10px] text-slate-400">
                            Reported: {new Date(issue.reportedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="bg-rose-100 text-rose-800 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
                          {issue.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No warranty claims reported.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Issue Warranty */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Issue Warranty Certificate</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueWarranty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Completed Project *</label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">Choose a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty Duration (Months)</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="6">6 Months</option>
                  <option value="12">12 Months (1 Year)</option>
                  <option value="24">24 Months (2 Years)</option>
                  <option value="36">36 Months (3 Years)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coverage Terms</label>
                <textarea
                  rows={3}
                  value={coverageTerms}
                  onChange={(e) => setCoverageTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  {submitting ? "Issuing..." : "Issue Warranty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Issue */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Log Warranty Claim Issue</span>
              </h3>
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogIssue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="e.g. Minor tile seepage near bathroom wall..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs"
                >
                  Log Claim Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
