"use client";

import React from "react";
import Link from "next/link";
import { X, ArrowRight, Briefcase, Calendar, CreditCard, ShieldCheck } from "lucide-react";

interface Project360DrawerProps {
  project: any;
  onClose: () => void;
  allUsers?: any[];
  workers?: any[];
  onOpenCustomer?: (cust: any) => void;
  onOpenPro?: (pro: any) => void;
  onPingParticipants?: (proj: any) => void;
}

export default function Project360Drawer({
  project,
  onClose,
  allUsers = [],
  workers = [],
  onOpenCustomer,
  onOpenPro,
  onPingParticipants
}: Project360DrawerProps) {
  if (!project) return null;

  const custObj = allUsers.find(u => u.id === project.customerId || u.email === project.customerEmail || u.name === project.customerName);
  const custAvatar = custObj?.avatar || custObj?.image || custObj?.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  const proObj = workers.find(w => w.id === project.workerId || w.name === project.workerName);
  const proAvatar = proObj?.avatar || proObj?.image || proObj?.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full p-6 overflow-y-auto space-y-6 shadow-2xl text-left border-l border-slate-200 animate-slide-in-right">
        {/* Header Bar */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0f2744] text-white">
              PROJECT & SERVICE 360° INSPECTION
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{project.title || project.serviceName || "Site Work"}</h3>
            <span className="text-xs text-slate-500 font-semibold">{project.category || project.workerCategory || "Workflow Trade"} · ID: #{project.id.slice(0, 8)}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Financial Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Stage Progress</span>
            <span className="text-base font-black text-[#0f2744]">{project.progressPercent || (project.status === "Completed" ? 100 : 25)}%</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Order Value / Budget</span>
            <span className="text-base font-black text-slate-900">₹{(project.price || project.estimatedCost || 50000).toLocaleString()}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Payment Status</span>
            <span className="text-xs font-black text-emerald-700 uppercase block mt-1">{project.paymentStatus || "Verified"}</span>
          </div>
        </div>

        {/* CUSTOMER & PROFESSIONAL DUAL CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Details Card */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px] space-y-3">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-200 pb-1">
              CUSTOMER DETAILS
            </span>
            <div className="flex items-center gap-3">
              <img src={custAvatar} className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0" alt="" />
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">{project.customerName || custObj?.name || "Client"}</span>
                <span className="text-[9.5px] text-slate-500 font-medium block truncate">{project.customerEmail || custObj?.email || "No email"}</span>
                <span className="text-[9.5px] text-slate-500 font-mono block">{project.customerPhone || custObj?.phone || "No phone"}</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onOpenCustomer) onOpenCustomer(custObj || { name: project.customerName, email: project.customerEmail, phone: project.customerPhone, id: project.customerId });
              }}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-[4px] py-1.5 text-[10px] font-extrabold uppercase transition cursor-pointer"
            >
              Inspect Customer 360° ↗
            </button>
          </div>

          {/* Professional Details Card */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px] space-y-3">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-200 pb-1">
              ASSIGNED PROFESSIONAL
            </span>
            <div className="flex items-center gap-3">
              <img src={proAvatar} className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0" alt="" />
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-900 block truncate">{project.workerName || proObj?.name || "Unassigned"}</span>
                <span className="text-[9.5px] text-indigo-700 font-bold block truncate">{project.workerCategory || proObj?.category || "Specialist"}</span>
                <span className="text-[9.5px] text-slate-500 font-mono block">{proObj?.phone || "Active Pro"}</span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (proObj && onOpenPro) onOpenPro(proObj);
                else alert("No assigned professional record attached.");
              }}
              className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-[4px] py-1.5 text-[10px] font-extrabold uppercase transition cursor-pointer"
            >
              Inspect Professional 360° ↗
            </button>
          </div>
        </div>

        {/* Workspace Quick Controls */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Workspace Quick Controls</h4>
          <div className="flex gap-2">
            <Link
              href={`/workspace/${project.id}`}
              target="_blank"
              className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2 rounded-[6px] text-xs font-extrabold uppercase tracking-wider text-center no-underline transition shadow-subtle flex items-center justify-center gap-1.5"
            >
              <span>⚡ Launch Live Stage Workspace</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
            <button
              onClick={() => {
                if (onPingParticipants) onPingParticipants(project);
                else alert("Admin alert sent to project participants.");
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-[6px] text-xs font-bold border border-slate-200 cursor-pointer"
            >
              Ping Participants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
