"use client";

import React, { useState } from "react";
import { Milestone } from "@/lib/schema";
import { CheckCircle2, Lock, Unlock, X, ShieldAlert, Sparkles, Plus } from "lucide-react";

interface StageChecklistModalProps {
  milestone: Milestone;
  isClient: boolean;
  onClose: () => void;
  onToggleChecklistItem: (milestoneId: string, itemId: string) => Promise<void>;
  onAddChecklistItem: (milestoneId: string, title: string) => Promise<void>;
  onCompleteStage: (milestone: Milestone) => Promise<void>;
}

export default function StageChecklistModal({
  milestone,
  isClient,
  onClose,
  onToggleChecklistItem,
  onAddChecklistItem,
  onCompleteStage,
}: StageChecklistModalProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const defaultChecklist = [
    { id: "c-1", title: "Wiring Rough-in & Circuit Pulling", completed: true },
    { id: "c-2", title: "Switch Board & Junction Box Fixation", completed: true },
    { id: "c-3", title: "Earthing & Load Balance Testing", completed: false },
    { id: "c-4", title: "Final Inspection & Client Verification", completed: false },
  ];

  const checklist = milestone.stageChecklist && milestone.stageChecklist.length > 0
    ? milestone.stageChecklist
    : defaultChecklist;

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const is100Percent = completedCount === totalCount && totalCount > 0;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    try {
      await onAddChecklistItem(milestone.id, newItemTitle.trim());
      setNewItemTitle("");
    } catch (err) {
      console.error("Error adding checklist item:", err);
    }
  };

  const handleCompleteClick = async () => {
    if (!is100Percent) {
      alert("⛔ Cannot finish stage!\n\nAll checklist tasks must be marked 100% complete before completing this stage.");
      return;
    }
    setSubmitting(true);
    try {
      await onCompleteStage(milestone);
      onClose();
    } catch (err) {
      console.error("Error finishing stage:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
              Stage Checklist Guard
            </span>
            <h3 className="text-base font-black text-slate-900 mt-1">
              {milestone.title} Checklist
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-slate-600">Checklist Completion</span>
            <span className={is100Percent ? "text-emerald-600" : "text-amber-600"}>
              {completedCount} / {totalCount} ({Math.round((completedCount / (totalCount || 1)) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                is100Percent ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.round((completedCount / (totalCount || 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Checklist items list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleChecklistItem(milestone.id, item.id)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                item.completed
                  ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => {}}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span className={`text-xs font-bold ${item.completed ? "line-through text-slate-500" : ""}`}>
                  {item.title}
                </span>
              </div>

              {item.completed && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Add custom item form */}
        {!isClient && (
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Add checklist item..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs outline-none font-semibold"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-700 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>
        )}

        {/* Guard Warning Banner if incomplete */}
        {!is100Percent && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Cannot finish stage until all checklist items are ticked 100%.</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer text-xs"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleCompleteClick}
            disabled={!is100Percent || submitting}
            className={`px-5 py-2 text-xs font-extrabold uppercase rounded-lg shadow-md cursor-pointer flex items-center gap-1.5 ${
              is100Percent
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            {is100Percent ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{submitting ? "Processing..." : "Stage Complete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
