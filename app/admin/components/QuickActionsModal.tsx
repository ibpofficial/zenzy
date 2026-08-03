"use client";

import React from "react";
import Link from "next/link";
import { X, Zap, Briefcase, ShieldCheck, CreditCard, MessageSquare, Phone, Sparkles } from "lucide-react";

interface QuickActionsModalProps {
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function QuickActionsModal({ onClose, onNavigateTab }: QuickActionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-[8px] max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in text-left">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="font-extrabold text-sm text-slate-900 uppercase">Global Admin Operations Launcher</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/projects/create"
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 block cursor-pointer no-underline"
          >
            <Briefcase className="w-4 h-4 text-[#0f2744]" />
            <span className="text-xs font-black text-slate-900 block">Create Project Brief</span>
            <span className="text-[9px] text-slate-500 font-bold block">Start project workflow</span>
          </Link>

          <button
            onClick={() => { onClose(); onNavigateTab("verification"); }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 cursor-pointer border-none"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black text-slate-900 block">Verify Professional</span>
            <span className="text-[9px] text-slate-500 font-bold block">Review KYC queue</span>
          </button>

          <button
            onClick={() => { onClose(); onNavigateTab("payments"); }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 cursor-pointer border-none"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black text-slate-900 block">Release Escrow</span>
            <span className="text-[9px] text-slate-500 font-bold block">Approve milestone pay</span>
          </button>

          <button
            onClick={() => { onClose(); onNavigateTab("support"); }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 cursor-pointer border-none"
          >
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black text-slate-900 block">Dispatch Support</span>
            <span className="text-[9px] text-slate-500 font-bold block">Resolve ticket</span>
          </button>

          <button
            onClick={() => { onClose(); onNavigateTab("broadcast"); }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 cursor-pointer border-none"
          >
            <Phone className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-black text-slate-900 block">Send Broadcast</span>
            <span className="text-[9px] text-slate-500 font-bold block">Push notification</span>
          </button>

          <Link
            href="/admin/crm"
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-[6px] text-left transition space-y-1 block cursor-pointer no-underline"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-black text-slate-900 block">HubSpot Task</span>
            <span className="text-[9px] text-slate-500 font-bold block">CRM synchronization</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
