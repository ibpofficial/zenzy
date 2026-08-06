"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Crown,
  Search,
  Download,
  CheckCircle2,
  ChevronLeft,
  User,
  Mail,
  ShieldCheck,
  Zap,
  Filter,
  Sparkles,
  Award,
  Calendar,
  CreditCard,
  Phone
} from "lucide-react";

export default function AdminPremiumPage() {
  const { user, loading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Real-time listener for Firestore 'premiumPayments' collection
    const q = query(collection(db, "premiumPayments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setSubscriptions(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching premium subscriptions:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading]);

  if (authLoading || loading) {
    return <LoadingScreen mode="brand" />;
  }

  // Filter Subscriptions
  const filteredSubs = subscriptions.filter((s) => {
    const matchesPlan =
      planFilter === "all" || (s.planName || "").toLowerCase().includes(planFilter.toLowerCase());
    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      (s.paymentId || "").toLowerCase().includes(queryLower) ||
      (s.userName || "").toLowerCase().includes(queryLower) ||
      (s.userEmail || "").toLowerCase().includes(queryLower) ||
      (s.userPhone || "").toLowerCase().includes(queryLower) ||
      (s.planName || "").toLowerCase().includes(queryLower);

    return matchesPlan && matchesSearch;
  });

  // Financial Stats
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const activeCount = subscriptions.length;
  const proMonthlyCount = subscriptions.filter((s) => (s.planName || "").toLowerCase().includes("pro")).length;
  const eliteCount = subscriptions.filter((s) => (s.planName || "").toLowerCase().includes("elite") || (s.planName || "").toLowerCase().includes("enterprise")).length;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredSubs.length === 0) {
      alert("No premium subscription records to export.");
      return;
    }

    const headers = [
      "Payment ID",
      "User Name",
      "User Email",
      "User Phone",
      "User Type",
      "Plan Name",
      "Amount (INR)",
      "Billing Cycle",
      "Status",
      "Subscribed At",
      "Expires At"
    ];

    const rows = filteredSubs.map((s) => [
      s.paymentId || s.id,
      `"${s.userName || "Subscriber"}"`,
      `"${s.userEmail || ""}"`,
      `"${s.userPhone || ""}"`,
      s.userType || "Customer",
      `"${s.planName || "Pro"}"`,
      s.amount || 0,
      s.billingCycle || "Monthly",
      s.status || "Active",
      s.createdAt || new Date().toISOString(),
      s.expiresAt || "N/A"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `premium_subscriptions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 text-white rounded-pro-md p-6 sm:p-8 shadow-card border border-amber-900/30 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href="/admin"
                  className="text-amber-300 hover:text-white font-bold flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-pro-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Admin Center
                </Link>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300 font-extrabold uppercase text-[10px] bg-amber-500/20 px-2.5 py-0.5 rounded-pro-sm border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> Premium Memberships
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <Crown className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                Premium Subscriptions & Revenue Vault
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Live monitoring of all Pro, Elite, and Enterprise paid plan subscriptions processed via Razorpay Test Mode.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="pro-btn-secondary px-4 py-2 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-subtle hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4 text-amber-600" />
                Export CSV Audit Report
              </button>
            </div>
          </div>
        </div>

        {/* Hero Revenue Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Premium Revenue
            </span>
            <span className="text-xl font-black text-amber-600 font-mono tabular-nums mt-1 block">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Active Paid Subscribers
            </span>
            <span className="text-xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
              {activeCount} Members
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Pro Members (₹999/mo)
            </span>
            <span className="text-xl font-black text-indigo-600 font-mono tabular-nums mt-1 block">
              {proMonthlyCount}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Elite & Enterprise
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
              {eliteCount}
            </span>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="pro-card bg-white border border-slate-200 p-4 rounded-pro-md shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subscriber name, email, payment ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Plan Filter:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="pro">Pro Plan</option>
              <option value="elite">Elite Plan</option>
              <option value="business">Business Plan</option>
              <option value="enterprise">Enterprise Plan</option>
            </select>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="pro-card bg-white border border-slate-200 rounded-pro-md shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500/20" /> Paid Subscriptions Ledger ({filteredSubs.length})
            </h3>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="text-center py-16 p-6">
              <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-slate-800">No Premium Subscription Records</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                When customers or professionals subscribe to Pro or Elite plans, their Razorpay payment logs will display here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Subscriber Details</th>
                    <th className="py-3 px-4">Subscribed Plan</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4">Payment ID / Gateway</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Start & Expiry</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {s.userName || "Subscriber"}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {s.userEmail || s.userPhone || "—"}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-black text-amber-600 uppercase text-[11px] block flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500 fill-amber-500/20" /> {s.planName || "Pro Plan"}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {s.billingCycle || "Monthly"} Billing
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="font-black font-mono tabular-nums text-slate-900 text-sm">
                          ₹{(Number(s.amount) || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-800 text-[11px] font-bold block">
                          {s.paymentId || s.id}
                        </span>
                        <span className="text-[9.5px] font-extrabold text-emerald-600 block uppercase">
                          Razorpay Test Mode
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-pro-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                        <div>
                          <span className="block text-slate-700 font-bold">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : "—"}
                          </span>
                          <span className="text-[9.5px] text-slate-400 block">
                            Exp: {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString("en-IN") : "1 Year"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(s)}
                          className="pro-btn-secondary px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscription Detail Modal */}
        {selectedSub && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="pro-card bg-white border border-slate-200 rounded-pro-md p-6 max-w-md w-full shadow-float space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                  <h3 className="text-sm font-extrabold text-slate-900">Premium Membership Receipt</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-pro-sm border border-slate-200/80 space-y-1 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Payment ID</span>
                    <span className="font-bold text-slate-900">{selectedSub.paymentId || selectedSub.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Gateway</span>
                    <span className="font-bold text-emerald-600">Razorpay Test Mode</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscriber Name</span>
                    <span className="font-bold text-slate-900">{selectedSub.userName || "Subscriber"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-bold text-slate-900">{selectedSub.userEmail || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone</span>
                    <span className="font-bold text-slate-900">{selectedSub.userPhone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscribed Plan</span>
                    <span className="font-extrabold text-amber-600">{selectedSub.planName || "Pro Plan"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-black font-mono text-slate-900 text-base">
                      ₹{(Number(selectedSub.amount) || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="pro-btn-primary px-4 py-2 text-xs font-bold cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
