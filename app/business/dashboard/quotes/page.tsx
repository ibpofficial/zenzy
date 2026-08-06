"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Quotation } from "@/lib/schema";
import {
  FileText,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  Sparkles,
  Calculator,
  ShieldCheck,
  Send,
  FileCheck,
  GitBranch,
  AlertCircle,
  Users,
  Search
} from "lucide-react";
import { getQuoteStatusConfig, isQuoteExpiringSoon, isQuoteExpired } from "@/lib/quoteUtils";

export default function BusinessQuotesPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Query quotes for this worker or business account
    const bId = user.uid;
    const q = query(
      collection(db, "quotations"),
      where("workerId", "==", bId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Quotation[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Quotation);
        });

        // Also check if businessId matches for team quotes
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setQuotations(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching business quotations:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const acceptedCount = quotations.filter(
    (q) => (q.status || "").toLowerCase() === "accepted"
  ).length;

  const totalVal = quotations.reduce(
    (sum, q) => sum + (q.grandTotal || q.total || 0),
    0
  );

  const expiringSoonCount = quotations.filter(q => isQuoteExpiringSoon(q)).length;

  const filteredQuotations = quotations.filter((q) => {
    const s = (q.status || "draft").toLowerCase();
    const matchesFilter =
      statusFilter === "all" ||
      (statusFilter === "accepted" && s === "accepted") ||
      (statusFilter === "viewed" && s === "viewed") ||
      (statusFilter === "pending" && (s === "pending" || s === "sent")) ||
      (statusFilter === "expired" && isQuoteExpired(q));

    const matchesSearch =
      !searchQuery ||
      (q.projectTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.quoteNumber || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quotation & Proposal Center
            </h1>
            <span className="bg-primary-50 text-primary-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-primary-200">
              Pro Engine
            </span>
            {userData?.teamModeEnabled && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Users className="w-3 h-3" /> Team Mode Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create, track, and manage official client estimate proposals and revision histories
          </p>
        </div>

        {/* Primary Action Button -> Redirects to /worker/quote-generator */}
        <Link
          href="/worker/quote-generator"
          className="pro-btn-primary px-4 py-2.5 text-xs font-bold tracking-wider transition shadow-subtle flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Quote Generator</span>
        </Link>
      </div>

      {/* Redirect Highlight Banner Card */}
      <div className="bg-slate-900 rounded-pro-lg p-6 text-white shadow-subtle border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-primary-500/20 text-primary-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-primary-400/30">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Official Zenzy Quote Studio</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Build or revise a client quotation proposal
          </h2>
          <p className="text-xs text-slate-300 font-normal leading-relaxed">
            Itemized catalog picker, GST calculations, starter templates, e-signatures, and instant WhatsApp delivery.
          </p>
        </div>

        <Link
          href="/worker/quote-generator"
          className="bg-white hover:bg-slate-100 text-slate-900 px-5 py-3 rounded-pro-sm font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Open Quote Generator</span>
          <ArrowRight className="w-4 h-4 text-primary-600" />
        </Link>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-pro-md space-y-1 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Proposals
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            {quotations.length}
          </div>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-200/80 p-4 rounded-pro-md space-y-1 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Accepted Deals
          </span>
          <div className="text-2xl font-black text-emerald-900 font-mono tabular-nums">
            {acceptedCount}
          </div>
        </div>

        <div className="bg-primary-50/40 border border-primary-200/80 p-4 rounded-pro-md space-y-1 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
            Pipeline Value
          </span>
          <div className="text-2xl font-black text-primary-900 font-mono tabular-nums">
            ₹{totalVal.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="bg-amber-50/40 border border-amber-200/80 p-4 rounded-pro-md space-y-1 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Expiring Soon
          </span>
          <div className="text-2xl font-black text-amber-900 font-mono tabular-nums">
            {expiringSoonCount}
          </div>
        </div>
      </div>

      {/* Sent Quotations Registry Table & Search */}
      <div className="bg-white border border-slate-200 rounded-pro-md p-5 space-y-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" />
            <span>Sent Proposals Registry ({filteredQuotations.length})</span>
          </h3>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quote or client..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-medium outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-pro-sm text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-pro-sm transition ${statusFilter === "all" ? "bg-white text-slate-900 shadow-subtle" : "text-slate-500 hover:text-slate-800"}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("accepted")}
                className={`px-2.5 py-1 rounded-pro-sm transition ${statusFilter === "accepted" ? "bg-white text-emerald-700 shadow-subtle" : "text-slate-500 hover:text-slate-800"}`}
              >
                Accepted
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("viewed")}
                className={`px-2.5 py-1 rounded-pro-sm transition ${statusFilter === "viewed" ? "bg-white text-primary-700 shadow-subtle" : "text-slate-500 hover:text-slate-800"}`}
              >
                Viewed
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading registered quotations...</span>
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-800 font-bold text-xs">No matching quotations found</p>
              <p className="text-slate-400 text-[11px]">
                Create a new quote or adjust your search filter.
              </p>
            </div>
            <Link
              href="/worker/quote-generator"
              className="pro-btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Quote</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQuotations.map((q) => {
              const statusCfg = getQuoteStatusConfig(q.status, q.expiryDate);
              const qVer = Number(q.version || 1);

              return (
                <div
                  key={q.id}
                  className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 px-3 rounded-pro-sm transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">
                        {q.projectTitle || q.quoteNumber || "Quotation Proposal"}
                      </span>

                      <span className={`px-2 py-0.5 rounded-pro-sm text-[9px] font-bold ${statusCfg.badgeClass}`}>
                        {statusCfg.label}
                      </span>

                      {qVer > 1 && (
                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-primary-600" /> v{qVer}
                        </span>
                      )}

                      {(q as any).approvalStatus === "pending" && (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">
                          Approval Needed
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium">
                      Client:{" "}
                      <strong className="text-slate-800">
                        {q.customerName || q.customerEmail || q.sharedWithEmail || "N/A"}
                      </strong>
                    </div>

                    {q.createdAt && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Sent #{q.quoteNumber || q.id.slice(0, 8)} on{" "}
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      ₹{(q.grandTotal || q.total || 0).toLocaleString("en-IN")}
                    </span>

                    <Link
                      href={`/quote/${q.id}`}
                      className="pro-btn-secondary py-1 px-3 text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

