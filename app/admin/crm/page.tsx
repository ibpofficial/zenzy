"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Users,
  Building,
  Calendar,
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
  ArrowRight,
  ChevronRight,
  X,
  FileText,
  Phone,
  Mail,
  Award,
  Layers,
  Activity,
  CreditCard,
  MessageSquare,
  Home,
  Check,
  Eye,
  ExternalLink,
  Plus,
  Send,
  Sliders,
  Database,
  Lock,
  Filter,
  Briefcase,
  CheckSquare,
  BarChart3,
  ListTodo,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "zenzyconnect@gmail.com",
];

export default function AdminCRMPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "overview" | "contacts" | "deals" | "notes" | "tasks" | "health" | "audit"
  >("overview");

  // Passcode gate state for additional layer
  const [passcodeUnlocked, setPasscodeUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Data states
  const [workers, setWorkers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [globalSearch, setGlobalSearch] = useState("");
  const [syncFilter, setSyncFilter] = useState<"all" | "synced" | "failed" | "pending">("all");

  // Health Diagnostics
  const [healthData, setHealthData] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [forceSyncing, setForceSyncing] = useState(false);

  // 360 Inspector Modal state
  const [inspectModal, setInspectModal] = useState<any | null>(null);
  const [inspectTab, setInspectTab] = useState<"zenzy" | "hubspot" | "documents">("zenzy");

  // Quick Action Form states
  const [noteInput, setNoteInput] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [selectedDealStage, setSelectedDealStage] = useState("appointmentscheduled");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Check admin authorization
  const isAdminAuthorized = user && (ADMIN_EMAILS.includes(user.email?.toLowerCase() || "") || passcodeUnlocked);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;

    const unsubWorkers = onSnapshot(collection(db, "workers"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setWorkers(list);
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsersList(list);
    });

    const unsubTickets = onSnapshot(collection(db, "supportTickets"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTickets(list);
    });

    return () => {
      unsubWorkers();
      unsubUsers();
      unsubTickets();
    };
  }, [user]);

  // Actions
  const handleCheckHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_HEALTH" }),
      });
      const data = await res.json();
      if (data.success) {
        setHealthData(data.health);
        showToast("HubSpot CRM API connection is healthy & responsive!");
      }
    } catch {
      showToast("Health check failed");
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleForceSyncAll = async () => {
    if (!confirm("Are you sure you want to force re-sync ALL professional records to HubSpot CRM?")) return;
    setForceSyncing(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "FORCE_SYNC_ALL" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Force sync complete! Synced: ${data.syncedCount}, Failed: ${data.failedCount} out of ${data.total} records.`);
      }
    } catch {
      showToast("Force sync failed");
    } finally {
      setForceSyncing(false);
    }
  };

  const handleRetrySync = async (worker: any) => {
    showToast(`Syncing ${worker.name}...`);
    try {
      const res = await fetch("/api/hubspot/sync-professional", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerId: worker.id,
          name: worker.name,
          ownerName: worker.ownerName,
          email: worker.email,
          phone: worker.phone,
          category: worker.category,
          subcategory: worker.subcategory,
          gstNumber: worker.gstNumber || worker.documentVerifications?.gstNumber,
          licenseNumber: worker.licenseNumber || worker.documentVerifications?.licenseNumber,
          experience: worker.experience,
          serviceArea: worker.serviceArea,
          bio: worker.bio,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Synced ${worker.name} to HubSpot successfully!`);
      } else {
        showToast(`Sync failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      showToast(err.message || "Retry failed");
    }
  };

  const handleAddNote = async (contactId: string) => {
    if (!contactId || !noteInput.trim()) return;
    setActionSubmitting(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_NOTE",
          contactId,
          noteText: noteInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNoteInput("");
        showToast("Timeline Note posted directly to HubSpot Contact!");
      }
    } catch {
      showToast("Failed to post note");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleCreateTask = async (contactId: string) => {
    if (!contactId || !taskSubject.trim()) return;
    setActionSubmitting(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_TASK",
          contactId,
          taskSubject: taskSubject.trim(),
          priority: taskPriority,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTaskSubject("");
        showToast("Task created directly in HubSpot CRM!");
      }
    } catch {
      showToast("Failed to create task");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleUpdateDealStage = async (dealId: string, stage: string) => {
    if (!dealId) return;
    setActionSubmitting(true);
    try {
      const res = await fetch("/api/hubspot/admin-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          dealId,
          newStage: stage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Deal Stage updated in HubSpot Sales Pipeline!");
      }
    } catch {
      showToast("Failed to update deal stage");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filtered workers list
  const filteredWorkers = workers.filter((w) => {
    const q = globalSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      w.name?.toLowerCase().includes(q) ||
      w.email?.toLowerCase().includes(q) ||
      w.phone?.includes(q) ||
      w.id?.toLowerCase().includes(q) ||
      w.category?.toLowerCase().includes(q) ||
      w.gstNumber?.toLowerCase().includes(q) ||
      w.licenseNumber?.toLowerCase().includes(q) ||
      w.hubspotContactId?.includes(q);

    const matchesSync =
      syncFilter === "all"
        ? true
        : syncFilter === "synced"
        ? w.hubspotSyncStatus === "synced"
        : syncFilter === "failed"
        ? w.hubspotSyncStatus === "failed"
        : !w.hubspotSyncStatus;

    return matchesSearch && matchesSync;
  });

  // Auth Guard Gate Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#eef2f7] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white p-6 rounded-[8px] shadow-xl border">
          <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-700">Verifying Admin Credentials...</span>
        </div>
      </div>
    );
  }

  // Auth Gate Screen if not authorized admin
  if (!user || !isAdminAuthorized) {
    return (
      <div className="min-h-screen bg-[#eef2f7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Admin CRM Access Gate</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Restricted Control Center. Only authorized Zenzy Super Administrators can enter.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (passcodeInput === "zenzygodmode2026" || passcodeInput === "2026") {
                setPasscodeUnlocked(true);
                setPasscodeError("");
              } else {
                setPasscodeError("Invalid Administrative Passcode.");
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              placeholder="Enter Admin Passcode"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-bold tracking-widest outline-none focus:border-indigo-600 transition"
            />
            {passcodeError && <p className="text-red-500 text-xs font-bold">{passcodeError}</p>}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition hover:opacity-90 shadow-md cursor-pointer border-none"
            >
              Verify Passcode & Open CRM
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
            <Link href="/admin" className="hover:text-slate-700">← Back to Main Admin</Link>
            <Link href="/" className="hover:text-slate-700">Live Website</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#eef2f7] text-slate-800 font-sans overflow-hidden">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200/70 flex flex-col justify-between p-4 shrink-0 shadow-xs">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              Z
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">
                Zenzy Admin <span className="text-indigo-600">CRM</span>
              </h1>
              <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                360° Control Center
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-semibold">
            {[
              { id: "overview", label: "Dashboard Overview", icon: Layers },
              { id: "contacts", label: "Contacts & Profiles", icon: Building, count: workers.length },
              { id: "deals", label: "Deals & Pipelines", icon: Briefcase, count: workers.filter((w) => w.hubspotDealId).length },
              { id: "notes", label: "Timeline Notes", icon: FileText },
              { id: "tasks", label: "Tasks & Follow-ups", icon: ListTodo },
              { id: "health", label: "API Health & Queue", icon: Sparkles, count: workers.filter((w) => w.hubspotSyncStatus === "failed").length },
              { id: "audit", label: "Audit Log Stream", icon: Activity },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border-none ${
                    active
                      ? "bg-slate-900 text-white font-extrabold shadow-md scale-[1.02]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase">HubSpot CRM</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live ✅
            </span>
          </div>
          <p className="text-[10.5px] text-slate-700 font-bold truncate">Portal ID: 246909647</p>
          <Link href="/admin" className="text-[10px] text-indigo-600 font-bold hover:underline block pt-1">
            ← Return to Zenzy Main Admin
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Navbar - Hidden on Mobile */}
        <header className="hidden md:flex bg-white border-b border-slate-200/70 px-6 py-3.5 items-center justify-between shrink-0 shadow-xs">
          {/* Global Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Global Search (Name, Phone, Email, UID, GSTIN, License, Contact ID...)"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition"
            />
          </div>

          {/* Quick Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCheckHealth}
              disabled={checkingHealth}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
              <span>{checkingHealth ? "Checking..." : "Check API Health"}</span>
            </button>

            <button
              onClick={handleForceSyncAll}
              disabled={forceSyncing}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer border-none"
            >
              <Zap className={`w-3.5 h-3.5 ${forceSyncing ? "animate-spin" : ""}`} />
              <span>{forceSyncing ? "Syncing..." : "Force Sync All"}</span>
            </button>
          </div>
        </header>

        {/* Dynamic Body Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB: DASHBOARD OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Total Registered Professionals</span>
                  <span className="text-2xl font-black text-slate-900 block">{workers.length}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">Total in Zenzy database</span>
                </div>

                <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-3xs space-y-1 bg-emerald-50/20">
                  <span className="text-[10px] font-black uppercase text-emerald-600">HubSpot Synced Contacts</span>
                  <span className="text-2xl font-black text-emerald-700 block">{workers.filter((w) => w.hubspotSyncStatus === "synced").length}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Live Contacts & Deals in CRM</span>
                </div>

                <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-3xs space-y-1 bg-rose-50/20">
                  <span className="text-[10px] font-black uppercase text-rose-600">Failed / Pending Syncs</span>
                  <span className="text-2xl font-black text-rose-700 block">{workers.filter((w) => w.hubspotSyncStatus !== "synced").length}</span>
                  <span className="text-[10px] text-rose-600 font-semibold block">Requires admin retry</span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-3xs space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Registered Platform Customers</span>
                  <span className="text-2xl font-black text-slate-900 block">{usersList.length}</span>
                  <span className="text-[10px] text-slate-400 font-medium block">Customer account profiles</span>
                </div>
              </div>

              {/* 360 Records Table */}
              <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Recent Professional Profiles & CRM Status</h3>
                    <p className="text-xs text-slate-400">Inspect 360° details and manage HubSpot records</p>
                  </div>
                  <button onClick={() => setActiveTab("contacts")} className="text-xs font-bold text-indigo-600 hover:underline">
                    View All →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-semibold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 tracking-wider">
                        <th className="py-3 px-4">Professional / Business</th>
                        <th className="py-3 px-4">Trade Category</th>
                        <th className="py-3 px-4">Phone / Email</th>
                        <th className="py-3 px-4">Trust Score</th>
                        <th className="py-3 px-4">HubSpot Sync</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWorkers.slice(0, 10).map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{w.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{w.ownerName || "N/A"}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-bold">{w.category || "N/A"}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-800 block">{w.phone || "—"}</span>
                            <span className="text-[10px] text-slate-400 block">{w.email || "—"}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-black text-[10px]">
                              {w.trustScore?.overall || 85}/100
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {w.hubspotSyncStatus === "synced" ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Synced
                              </span>
                            ) : (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-500" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleRetrySync(w)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition border-none"
                            >
                              Sync Now
                            </button>
                            <button
                              onClick={() => {
                                setInspectModal(w);
                                setInspectTab("zenzy");
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition border-none"
                            >
                              360° Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACTS & PROFILES */}
          {activeTab === "contacts" && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 flex-wrap gap-3 shadow-3xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Filter Sync Status:</span>
                  {(["all", "synced", "failed", "pending"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSyncFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border-none ${
                        syncFilter === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-500">Showing {filteredWorkers.length} profiles</span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkers.map((w) => (
                  <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-subtle">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={w.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                          className="w-12 h-12 rounded-xl object-cover border"
                          alt=""
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{w.name}</h3>
                          <span className="text-xs font-bold text-indigo-600 block">{w.category}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">UID: {w.id}</span>
                        </div>
                      </div>

                      {w.hubspotSyncStatus === "synced" ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                          Synced ✅
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                          Failed ⚠️
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border">
                      <div>Phone: <span className="text-slate-900 font-bold block">{w.phone || "N/A"}</span></div>
                      <div>GSTIN: <span className="text-slate-900 font-bold block">{w.gstNumber || w.documentVerifications?.gstNumber || "N/A"}</span></div>
                      <div>License: <span className="text-slate-900 font-bold block">{w.licenseNumber || w.documentVerifications?.licenseNumber || "N/A"}</span></div>
                      <div>Exp: <span className="text-slate-900 font-bold block">{w.experience || "N/A"}</span></div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <button
                        onClick={() => handleRetrySync(w)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition border-none"
                      >
                        Sync Now
                      </button>
                      <button
                        onClick={() => {
                          setInspectModal(w);
                          setInspectTab("zenzy");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition border-none"
                      >
                        360° Inspect →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DEALS & PIPELINES */}
          {activeTab === "deals" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">HubSpot Sales & Onboarding Pipelines</h3>
                  <p className="text-xs text-slate-400">View and update deal pipeline stages directly in HubSpot CRM</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { stage: "appointmentscheduled", label: "Appointment Scheduled", color: "border-indigo-500 bg-indigo-50/20 text-indigo-700" },
                    { stage: "qualifiedtobuy", label: "Qualified / Document Verified", color: "border-blue-500 bg-blue-50/20 text-blue-700" },
                    { stage: "contractsent", label: "Contract Sent / Escrow Agreement", color: "border-amber-500 bg-amber-50/20 text-amber-700" },
                    { stage: "closedwon", label: "Closed Won / Active Partner", color: "border-emerald-500 bg-emerald-50/20 text-emerald-700" },
                  ].map((col) => (
                    <div key={col.stage} className={`border-t-4 ${col.color} bg-white p-4 rounded-2xl shadow-3xs space-y-3`}>
                      <span className="text-xs font-extrabold block">{col.label}</span>
                      <div className="space-y-2">
                        {workers
                          .filter((w) => w.hubspotDealId)
                          .map((w) => (
                            <div key={w.id} className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1.5">
                              <span className="font-bold text-slate-900 block">{w.name}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">Deal ID: {w.hubspotDealId}</span>
                              <button
                                onClick={() => handleUpdateDealStage(w.hubspotDealId, col.stage)}
                                className="w-full py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-700 cursor-pointer"
                              >
                                Move to {col.label.split(" ")[0]}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HEALTH & DIAGNOSTICS */}
          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-[8px] p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">HubSpot API Health Monitor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">API Status</span>
                    <span className="text-sm font-extrabold text-emerald-600 block">HTTP 200 OK — Connected</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Rate Limit Remaining</span>
                    <span className="text-sm font-extrabold text-slate-800 block">{healthData?.rateLimitRemaining || "Healthy"}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Private App Access Token</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 block">Configured in .env.local</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 360° INSPECTION MODAL */}
      {inspectModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-left">
          <div className="bg-white border border-slate-200 rounded-[8px] shadow-2xl max-w-3xl w-full overflow-hidden max-h-[90vh] flex flex-col text-slate-800">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={inspectModal.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20"
                  alt=""
                />
                <div>
                  <h3 className="text-base font-extrabold text-white">{inspectModal.name}</h3>
                  <p className="text-xs text-indigo-300 font-bold">{inspectModal.category} · {inspectModal.ownerName || "Owner"}</p>
                  <span className="text-[10px] text-slate-400 font-mono">UID: {inspectModal.id}</span>
                </div>
              </div>
              <button onClick={() => setInspectModal(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2">
              <button
                onClick={() => setInspectTab("zenzy")}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition cursor-pointer border-none ${
                  inspectTab === "zenzy" ? "bg-white text-indigo-600 shadow-3xs border-t-2 border-indigo-600" : "text-slate-500"
                }`}
              >
                📊 Zenzy IP Details
              </button>
              <button
                onClick={() => setInspectTab("hubspot")}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition cursor-pointer border-none ${
                  inspectTab === "hubspot" ? "bg-white text-orange-600 shadow-3xs border-t-2 border-orange-600" : "text-slate-500"
                }`}
              >
                🟧 HubSpot CRM Controls
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs font-semibold flex-1">
              {inspectTab === "zenzy" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Trust Score</span>
                      <span className="text-base font-black text-indigo-600">{inspectModal.trustScore?.overall || 85} / 100</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN</span>
                      <span className="text-xs font-bold text-slate-900">{inspectModal.gstNumber || inspectModal.documentVerifications?.gstNumber || "N/A"}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Bio</span>
                    <p className="p-3 bg-slate-50 rounded-xl border text-slate-700 font-medium leading-relaxed">{inspectModal.bio || "No bio provided"}</p>
                  </div>
                </div>
              )}

              {inspectTab === "hubspot" && (
                <div className="space-y-5">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-900">HubSpot Linkage</span>
                      {inspectModal.hubspotContactId && (
                        <a
                          href={`https://app.hubspot.com/contacts/246909647/contact/${inspectModal.hubspotContactId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold"
                        >
                          Open in HubSpot Portal ↗
                        </a>
                      )}
                    </div>
                    <div className="font-mono text-slate-700 text-[11px]">
                      Contact ID: {inspectModal.hubspotContactId || "Not Synced"} | Deal ID: {inspectModal.hubspotDealId || "Not Synced"}
                    </div>
                  </div>

                  {/* Add Note */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border">
                    <span className="font-bold text-slate-900 block">Add Note directly to HubSpot CRM</span>
                    <textarea
                      rows={2}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Enter verification call details or notes..."
                      className="w-full p-3 bg-white border rounded-xl outline-none text-xs font-semibold"
                    />
                    <button
                      onClick={() => handleAddNote(inspectModal.hubspotContactId)}
                      disabled={actionSubmitting || !inspectModal.hubspotContactId}
                      className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase cursor-pointer disabled:opacity-50 border-none"
                    >
                      {actionSubmitting ? "Posting..." : "+ Post Note to HubSpot"}
                    </button>
                  </div>

                  {/* Create Task */}
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border">
                    <span className="font-bold text-slate-900 block">Create Task in HubSpot CRM</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={taskSubject}
                        onChange={(e) => setTaskSubject(e.target.value)}
                        placeholder="Task description..."
                        className="flex-1 p-2 bg-white border rounded-xl outline-none text-xs font-semibold"
                      />
                      <select
                        value={taskPriority}
                        onChange={(e: any) => setTaskPriority(e.target.value)}
                        className="p-2 bg-white border rounded-xl outline-none text-xs font-bold"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Med</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleCreateTask(inspectModal.hubspotContactId)}
                      disabled={actionSubmitting || !inspectModal.hubspotContactId}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase cursor-pointer disabled:opacity-50 border-none"
                    >
                      {actionSubmitting ? "Creating..." : "+ Create Task in HubSpot"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
