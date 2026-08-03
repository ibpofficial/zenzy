"use client";

import React, { useState } from "react";
import { WorkflowStage, WorkflowTemplate } from "@/lib/schema";
import { STARTER_WORKFLOW_TEMPLATES } from "@/lib/workflowTemplates";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Plus, X, Trash2, CheckCircle, Sparkles, Layers, ShieldCheck, IndianRupee } from "lucide-react";

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStages: (stages: WorkflowStage[]) => void;
  businessId?: string;
  initialStages?: WorkflowStage[];
}

export default function WorkflowBuilderModal({
  isOpen,
  onClose,
  onSelectStages,
  businessId,
  initialStages
}: WorkflowBuilderModalProps) {
  const [stages, setStages] = useState<WorkflowStage[]>(initialStages && initialStages.length > 0 ? initialStages : STARTER_WORKFLOW_TEMPLATES[0].stages);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // New Stage Draft Form State
  const [newStageName, setNewStageName] = useState("");
  const [newDuration, setNewDuration] = useState<number>(7);
  const [newDependsOn, setNewDependsOn] = useState<string[]>([]);
  const [newPaymentLinked, setNewPaymentLinked] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState<number>(25000);
  const [newInspectionRequired, setNewInspectionRequired] = useState(false);
  const [newMediaRequired, setNewMediaRequired] = useState(true);
  const [newMandatory, setNewMandatory] = useState(true);

  if (!isOpen) return null;

  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    const stageId = `custom-stage-${Date.now()}`;
    const newStage: WorkflowStage = {
      id: stageId,
      name: newStageName.trim(),
      expectedDurationDays: newDuration,
      dependsOn: newDependsOn,
      paymentLinked: newPaymentLinked,
      paymentAmount: newPaymentLinked ? newPaymentAmount : undefined,
      approvalNeeded: true,
      inspectionRequired: newInspectionRequired,
      mediaRequired: newMediaRequired,
      mandatory: newMandatory,
      order: stages.length + 1
    };

    setStages([...stages, newStage]);
    setNewStageName("");
    setNewDependsOn([]);
    setNewPaymentLinked(false);
  };

  const handleRemoveStage = (id: string) => {
    setStages(stages.filter((s) => s.id !== id));
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || !businessId) {
      alert("Please specify a template name.");
      return;
    }

    try {
      setSavingTemplate(true);
      const templateData: Omit<WorkflowTemplate, "id"> = {
        businessId,
        name: templateName.trim(),
        stages,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "workflowTemplates"), templateData);
      alert(`✓ Workflow Template "${templateName}" saved successfully!`);
      setTemplateName("");
    } catch (err) {
      console.error("Failed to save workflow template:", err);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleApply = () => {
    onSelectStages(stages);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-[10px] shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[6px] bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white">Custom Workflow & Dependency Builder</h3>
              <p className="text-[10px] text-slate-400 font-medium">Configure stages, rules, dependencies & payment gates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-[6px]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Starter Templates Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto hide-scrollbar text-[10px] font-bold">
          <span className="text-slate-500 uppercase tracking-wider shrink-0 px-1">Presets:</span>
          {STARTER_WORKFLOW_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setStages(tmpl.stages)}
              className="bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 px-2.5 py-1 rounded-[6px] whitespace-nowrap transition cursor-pointer font-bold"
            >
              ⚡ {tmpl.name} ({tmpl.stages.length} Stages)
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          
          {/* Active Stages List */}
          <div className="space-y-2.5">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Active Workflow Stages ({stages.length})</h4>
            {stages.map((st, idx) => (
              <div key={st.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[8px] flex justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs">#{idx + 1}. {st.name}</span>
                    {st.mandatory && <span className="text-[9px] font-bold uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[4px] border border-rose-200">Mandatory</span>}
                    {st.inspectionRequired && <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-[4px] border border-amber-200">Inspection</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-500 font-semibold">
                    <span>Est: {st.expectedDurationDays || 7} Days</span>
                    {st.dependsOn && st.dependsOn.length > 0 && (
                      <span className="text-indigo-600 font-bold">Depends On: {st.dependsOn.join(", ")}</span>
                    )}
                    {st.paymentLinked && (
                      <span className="text-emerald-700 font-bold">Payment Linked: ₹{(st.paymentAmount || 0).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemoveStage(st.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-[4px]">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Stage Form */}
          <div className="bg-slate-50 p-4 rounded-[8px] border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">+ Add Custom Stage</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Stage Name e.g. Tile Laying & Grouting"
                className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(parseInt(e.target.value) || 1)}
                placeholder="Duration Days e.g. 7"
                className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Depends On Selector */}
            {stages.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Prerequisite Stage Dependency</label>
                <select
                  multiple
                  value={newDependsOn}
                  onChange={(e) => setNewDependsOn(Array.from(e.target.selectedOptions, (o) => o.value))}
                  className="w-full bg-white border border-slate-200 rounded-[6px] p-2 text-xs text-slate-900 outline-none"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      Must complete after #{s.order}: {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Requirement Flags */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPaymentLinked}
                  onChange={(e) => setNewPaymentLinked(e.target.checked)}
                  className="rounded-[4px] text-indigo-600"
                />
                <span>Payment Linked</span>
              </label>
              {newPaymentLinked && (
                <input
                  type="number"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(parseInt(e.target.value) || 0)}
                  placeholder="Amount ₹"
                  className="bg-white border border-slate-200 rounded-[6px] px-2 py-1 text-xs w-28 text-slate-900"
                />
              )}

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newInspectionRequired}
                  onChange={(e) => setNewInspectionRequired(e.target.checked)}
                  className="rounded-[4px] text-indigo-600"
                />
                <span>Inspection Required</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMandatory}
                  onChange={(e) => setNewMandatory(e.target.checked)}
                  className="rounded-[4px] text-indigo-600"
                />
                <span>Mandatory</span>
              </label>
            </div>

            <button
              onClick={handleAddStage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-[6px] text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Add Stage to Workflow
            </button>
          </div>

          {/* Save as Reusable Template Section */}
          {businessId && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-[8px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider">Save as Reusable Template</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name e.g. Premium 3BHK Renovation Standard"
                  className="w-full bg-white border border-indigo-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>
              <button
                disabled={savingTemplate || !templateName.trim()}
                onClick={handleSaveAsTemplate}
                className="bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-[6px] text-xs uppercase tracking-wider transition shrink-0 cursor-pointer"
              >
                {savingTemplate ? "Saving..." : "Save Template"}
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500">{stages.length} Total Stages Configured</span>
          <button
            onClick={handleApply}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-5 py-2 rounded-[6px] text-xs uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            Apply Workflow to Project <CheckCircle className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
