"use client";

import React, { useState } from "react";
import { ProjectDecision, DecisionOption } from "@/lib/schema";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  X,
  Sparkles,
  HelpCircle,
  ArrowRight,
  MessageSquare
} from "lucide-react";

interface DecisionCenterModalProps {
  decisions: ProjectDecision[];
  isClient: boolean;
  onRespondDecision: (
    decision: ProjectDecision,
    status: "approved" | "rejected" | "changes_requested",
    selectedOptionId?: string,
    customerNotes?: string
  ) => void;
  onCreateDecision: (
    title: string,
    description: string,
    options: DecisionOption[],
    deadline: string
  ) => void;
}

export default function DecisionCenterModal({
  decisions,
  isClient,
  onRespondDecision,
  onCreateDecision,
}: DecisionCenterModalProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const [options, setOptions] = useState<DecisionOption[]>([
    { id: "opt-1", title: "Option A", description: "Standard Specification", imageUrl: "" },
    { id: "opt-2", title: "Option B", description: "Premium Specification", imageUrl: "" },
  ]);

  const [selectedOptionMap, setSelectedOptionMap] = useState<Record<string, string>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    const nextNum = options.length + 1;
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, title: `Option ${String.fromCharCode(64 + nextNum)}`, description: "", imageUrl: "" },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      alert("At least two choices are required for a decision card.");
      return;
    }
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateDecision(title.trim(), description.trim(), options, deadline);
    setTitle("");
    setDescription("");
    setDeadline("");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
            Decision Center (Customer Approvals)
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            Resolve material selections, tile patterns, color choices, and layout options with recorded sign-offs.
          </p>
        </div>

        {!isClient && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition cursor-pointer border-none flex items-center gap-2 shadow-subtle shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Decision Card</span>
          </button>
        )}
      </div>

      {/* Decisions List */}
      {decisions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-900 text-base uppercase tracking-wider">
              No Pending Decisions
            </h4>
            <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto">
              When contractors require customer selection on tiles, fixtures, or paints, decision cards will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {decisions.map((dec) => {
            const isPending = dec.status === "pending";
            const selectedOptId = selectedOptionMap[dec.id] || dec.selectedOptionId || dec.options[0]?.id;

            return (
              <div
                key={dec.id}
                className={`bg-white rounded-xl border p-6 space-y-5 shadow-subtle transition ${
                  isPending ? "border-indigo-200 bg-indigo-50/20" : "border-slate-200"
                }`}
              >
                {/* Decision Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-100 text-indigo-700 font-mono font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md">
                        Decision Request
                      </span>
                      {dec.deadline && (
                        <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Deadline: {dec.deadline}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-base mt-1">
                      {dec.title}
                    </h4>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      dec.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : dec.status === "rejected"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {dec.status.replace(/_/g, " ")}
                  </span>
                </div>

                {dec.description && (
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    {dec.description}
                  </p>
                )}

                {/* Option Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {dec.options.map((opt) => {
                    const isSelected = selectedOptId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (isPending && isClient) {
                            setSelectedOptionMap({ ...selectedOptionMap, [dec.id]: opt.id });
                          }
                        }}
                        className={`rounded-xl border p-4 space-y-2 transition cursor-pointer relative ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 bg-indigo-600 text-white p-1 rounded-full text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}

                        {opt.imageUrl && (
                          <img
                            src={opt.imageUrl}
                            alt={opt.title}
                            className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          />
                        )}

                        <div>
                          <h5 className="font-extrabold text-xs text-slate-900">{opt.title}</h5>
                          {opt.description && (
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {opt.description}
                            </p>
                          )}
                          {opt.costImpact ? (
                            <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                              +₹{opt.costImpact.toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Customer Action Form */}
                {isPending && isClient && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 pt-3">
                    <span className="text-xs font-extrabold text-slate-800 uppercase block tracking-wider">
                      Customer Decision Action
                    </span>

                    <input
                      type="text"
                      placeholder="Optional notes or change request details..."
                      value={notesMap[dec.id] || ""}
                      onChange={(e) => setNotesMap({ ...notesMap, [dec.id]: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500"
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() =>
                          onRespondDecision(dec, "approved", selectedOptId, notesMap[dec.id])
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Selection</span>
                      </button>

                      <button
                        onClick={() =>
                          onRespondDecision(dec, "changes_requested", selectedOptId, notesMap[dec.id])
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() =>
                          onRespondDecision(dec, "rejected", selectedOptId, notesMap[dec.id])
                        }
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase px-4 py-2 rounded-lg transition cursor-pointer border-none flex items-center gap-1.5 shadow-subtle"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Decision Modal Form */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Create Customer Decision Card
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Decision Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Choose Kitchen Floor Tile Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Description / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Please choose between Option A and Option B by tomorrow..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Response Deadline</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow 5 PM"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-semibold"
                />
              </div>

              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 uppercase">Decision Choices</span>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-indigo-600 hover:text-indigo-700 font-extrabold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="bg-slate-50 border p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-slate-700">Option {idx + 1}</span>
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(opt.id)}
                            className="text-rose-600 text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Option Title (e.g. Option A - Italian Marble)"
                        value={opt.title}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].title = e.target.value;
                          setOptions(updated);
                        }}
                        className="w-full bg-white border rounded px-2.5 py-1.5 text-xs font-semibold"
                      />

                      <input
                        type="text"
                        placeholder="Image URL (Optional)"
                        value={opt.imageUrl || ""}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].imageUrl = e.target.value;
                          setOptions(updated);
                        }}
                        className="w-full bg-white border rounded px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase rounded-lg"
                >
                  Publish Decision Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
