"use client";

import React from "react";
import {
  Activity,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Database,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  CreditCard,
  ArrowRight,
  Building
} from "lucide-react";

export interface SystemInfrastructureHealthProps {
  maintenanceMode: boolean;
  hasAiApiKey: boolean;
  hubspotHealthData?: any;
  workersCount: number;
  bookingsCount: number;
  usersCount: number;
  rentalsCount: number;
  syncedWorkersCount: number;
  failedWorkersCount: number;
  checkingHealth: boolean;
  onCheckHubspotHealth: () => void;
  onNavigateTab: (tab: string) => void;
}

export default function SystemInfrastructureHealth({
  maintenanceMode,
  hasAiApiKey,
  hubspotHealthData,
  workersCount,
  bookingsCount,
  usersCount,
  rentalsCount,
  syncedWorkersCount,
  failedWorkersCount,
  checkingHealth,
  onCheckHubspotHealth,
  onNavigateTab,
}: SystemInfrastructureHealthProps) {
  const isHubspotOk = hubspotHealthData ? hubspotHealthData.connected : true;

  const services = [
    {
      name: "Live Website",
      subtext: maintenanceMode ? "Maintenance Mode ⚠️" : "Public Site Online",
      status: maintenanceMode ? "MAINTENANCE" : "ONLINE",
      ok: !maintenanceMode,
      icon: Globe,
      color: maintenanceMode ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"
    },
    {
      name: "HubSpot CRM API",
      subtext: isHubspotOk
        ? `${syncedWorkersCount} synced (${failedWorkersCount} retries)`
        : `Issue: ${hubspotHealthData?.error || "Disconnected"}`,
      status: isHubspotOk ? "CONNECTED" : "FAILED",
      ok: isHubspotOk,
      icon: Sparkles,
      color: isHubspotOk ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
    },
    {
      name: "Firestore DB",
      subtext: `${bookingsCount + usersCount + workersCount} docs indexed`,
      status: "ONLINE",
      ok: true,
      icon: Database,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200"
    },
    {
      name: "Zenzy AI Assistant",
      subtext: hasAiApiKey ? "Gemini 1.5 Flash Active" : "No API Key configured",
      status: hasAiApiKey ? "ACTIVE" : "STANDBY",
      ok: hasAiApiKey,
      icon: Zap,
      color: hasAiApiKey ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200"
    },
    {
      name: "Payment Gateway",
      subtext: "Manual Settlement Mode Active",
      status: "MANUAL",
      ok: false,
      icon: CreditCard,
      color: "bg-amber-50 text-amber-800 border-amber-200"
    },
    {
      name: "Security Console",
      subtext: "Passcode Protection Active",
      status: "SECURE",
      ok: true,
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200"
    }
  ];

  return (
    <div className="w-full bg-white border border-slate-200 p-5 rounded-[8px] space-y-4 shadow-subtle text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[6px] bg-slate-900 text-white shrink-0 shadow-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              System Infrastructure Health Bar
            </h3>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">Real-time status of APIs, CRM, Firestore DB, AI & Payment Infrastructure</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCheckHubspotHealth}
            disabled={checkingHealth}
            className="px-3 py-1.5 rounded-[6px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer flex items-center gap-1.5 text-[10px] font-bold shadow-2xs"
            title="Run Diagnostics Health Check"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
            <span>{checkingHealth ? "Pinging..." : "Check Health"}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("hubspot")}
            className="px-3 py-1.5 rounded-[6px] bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer flex items-center gap-1.5 text-[10px] font-extrabold uppercase border-none shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>CRM Hub</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("authority")}
            className="px-3 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer flex items-center gap-1.5 text-[10px] font-extrabold uppercase border border-slate-200"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>Authority</span>
          </button>
        </div>
      </div>

      {/* Horizontal Services Grid (6 Columns across desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {services.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.name} className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-[6px] flex flex-col justify-between gap-2.5 transition shadow-2xs">
              <div className="flex items-center justify-between gap-1">
                <div className="p-1.5 rounded-[4px] bg-white border border-slate-200 text-slate-700 shrink-0 shadow-2xs">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border shrink-0 ${s.color}`}>
                  {s.status}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-slate-900 block truncate leading-tight">{s.name}</span>
                <span className="text-[9px] text-slate-500 font-medium block truncate mt-0.5">{s.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Horizontal Active Records Strip */}
      <div className="border-t border-slate-100 pt-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0">
          <span>Active Records Matrix:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
          {[
            { label: "Bookings", count: bookingsCount, tab: "bookings" },
            { label: "Clients", count: usersCount, tab: "users" },
            { label: "Workers", count: workersCount, tab: "verification" },
            { label: "Rentals", count: rentalsCount, tab: "rentals" },
          ].map((c) => (
            <div
              key={c.label}
              onClick={() => onNavigateTab(c.tab)}
              className="bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-[6px] px-3.5 py-1.5 transition cursor-pointer flex items-center justify-between gap-3 min-w-[120px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">{c.count}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">{c.label}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
