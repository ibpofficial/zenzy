"use client";

import React, { useState } from "react";
import { ProjectDecision } from "@/lib/schema";
import {
  ShieldCheck,
  Plus,
  Calendar,
  UserCheck,
  Clock,
  IndianRupee,
  FileText,
  Camera,
  CheckCircle2,
  Lock
} from "lucide-react";

interface DecisionLogTabProps {
  decisions: ProjectDecision[];
  isClient: boolean;
  onAddDecision: (decision: Partial<ProjectDecision>) => Promise<void>;
}

export default function DecisionLogTab({
  decisions,
  isClient,
  onAddDecision,
}: DecisionLogTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState("Use White Italian Marble Tiles");
  const [description, setDescription] = useState(
    "Customer requested white Italian marble tiles instead of default ceramic tiles in master bedroom."
  );
  const [approvedByName, setApprovedByName] = useState("Customer (Signed Off)");
  const [costImpact, setCostImpact] = useState(15000);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newDecision: Partial<ProjectDecision> = {
        title: title.trim(),
        description: description.trim(),
        createdByName: approvedByName.trim(),
        status: "approved",
        createdAt: new Date().toISOString(),
        decidedAt: new Date().toISOString(),
        options: [
          {
            id: "opt-1",
            title: title.trim(),
            description: description.trim(),
            costImpact: Number(costImpact),
          },
        ],
      };

      await onAddDecision(newDecision);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating decision log:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-indigo-400/30">
              🔒 PERMANENT DECISION LOG
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {decisions.length} Decisions Vaulted
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Customer Decision Vault
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Immutable log of all tile choices, layout height changes, wallpaper cancellations, and sink shifts. Stored forever so nobody argues later.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? "Cancel Form" : "Log Permanent Decision"}</span>
        </button>
      </div>

      {/* FORM */}
      {showAddForm && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border-2 border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" /> Vault New Customer Decision
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Decision Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Use white tiles, Shift sink position"
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Approved By (Name) *</label>
              <input
                type="text"
                required
                value={approvedByName}
                onChange={(e) => setApprovedByName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Decision Details & Rationale</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-medium"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Financial / Cost Impact (₹)</label>
              <input
                type="number"
                value={costImpact}
                onChange={(e) => setCostImpact(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase rounded-lg shadow-md cursor-pointer"
            >
              {submitting ? "Vaulting..." : "Vault Decision Permanently"}
            </button>
          </div>
        </form>
      )}

      {/* DECISION CARDS LIST */}
      {decisions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Decision Log Entries Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Log decisions regarding tile choices, height adjustments, or sink shifts to store permanently in vault.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 hover:border-indigo-300 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="text-sm font-black text-slate-900">{d.title}</h3>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Vaulted
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {d.description}
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs font-semibold">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Approved By</span>
                  <span className="font-bold text-slate-900 block">{d.createdByName || "Customer"}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Timestamp</span>
                  <span className="font-mono text-slate-700 text-[11px] block">
                    {d.createdAt
                      ? new Date(d.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Vaulted"}
                  </span>
                </div>
              </div>

              {d.options && d.options[0]?.costImpact ? (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Financial Impact:</span>
                  <span className="font-black font-mono text-emerald-600">
                    +₹{d.options[0].costImpact.toLocaleString("en-IN")}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
