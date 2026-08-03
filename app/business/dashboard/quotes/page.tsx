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
  FileCheck
} from "lucide-react";

export default function BusinessQuotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "quotations"),
      where("businessId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Quotation[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Quotation);
        });
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
    (q) => q.status?.toLowerCase() === "accepted"
  ).length;
  const totalVal = quotations.reduce(
    (sum, q) => sum + (q.grandTotal || q.total || 0),
    0
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Quotation & Proposal Center
            </h1>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-200">
              Pro Module
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create, manage, and dispatch official project estimate proposals to clients
          </p>
        </div>

        {/* Primary Action Button -> Redirects to /worker/quote-generator */}
        <Link
          href="/worker/quote-generator"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Quote Generator</span>
        </Link>
      </div>

      {/* Redirect Highlight Banner Card */}
      <div className="bg-gradient-to-br from-[#0f2744] via-[#1a365d] to-[#0f2744] rounded-xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Official Zenzy Quote Engine</span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white">
            Need to build a professional client proposal?
          </h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Use the dedicated Quote Generator tool to customize itemized line items, GST calculations, payment terms, architectural parameters, and e-signatures.
          </p>
        </div>

        <Link
          href="/worker/quote-generator"
          className="bg-white hover:bg-slate-100 text-slate-950 px-5 py-3 rounded-lg font-extrabold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 duration-150"
        >
          <span>Open Quote Generator</span>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </Link>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Proposals</span>
          <div className="text-xl font-black text-slate-900">{quotations.length}</div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/80 p-4 rounded-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Accepted Deals</span>
          <div className="text-xl font-black text-emerald-900">{acceptedCount}</div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/80 p-4 rounded-lg space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Total Quoted Pipeline</span>
          <div className="text-xl font-black text-blue-900">₹{totalVal.toLocaleString()}</div>
        </div>
      </div>

      {/* Sent Quotations Registry Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Sent Proposals Registry ({quotations.length})</span>
          </h3>
          <Link
            href="/worker/quote-generator"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
          >
            <span>+ Create Quote</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading registered quotations...</span>
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-slate-700 font-bold text-xs">No quotations generated yet</p>
              <p className="text-slate-400 text-[11px]">Click below to create your first client estimate proposal.</p>
            </div>
            <Link
              href="/worker/quote-generator"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Quote</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quotations.map((q) => (
              <div
                key={q.id}
                className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/80 px-2 rounded-md transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {q.projectTitle || q.quoteNumber || "Quotation Proposal"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        q.status?.toLowerCase() === "accepted"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-blue-50 border-blue-200 text-blue-700"
                      }`}
                    >
                      {q.status || "Submitted"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Client: <strong className="text-slate-700">{q.customerEmail || q.sharedWithEmail || q.customerName || "N/A"}</strong>
                  </div>
                  {q.createdAt && (
                    <span className="text-[10px] text-slate-400 block">
                      Sent on {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="text-sm font-black text-slate-900">
                    ₹{(q.grandTotal || q.total || 0).toLocaleString()}
                  </span>
                  <Link
                    href={`/quote/${q.id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
