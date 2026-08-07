"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  CreditCard,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  RefreshCw,
  User,
  Building,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Filter,
  IndianRupee
} from "lucide-react";

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Real-time listener for Firestore 'payments' collection
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setPayments(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching payments:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [authLoading]);

  if (authLoading || loading) {
    return <LoadingScreen mode="brand" />;
  }

  // Filtered Payments
  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      statusFilter === "all" || (p.status || "").toLowerCase() === statusFilter.toLowerCase();
    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      (p.paymentId || "").toLowerCase().includes(queryLower) ||
      (p.orderId || "").toLowerCase().includes(queryLower) ||
      (p.clientName || "").toLowerCase().includes(queryLower) ||
      (p.clientEmail || "").toLowerCase().includes(queryLower) ||
      (p.workerName || "").toLowerCase().includes(queryLower) ||
      (p.quoteId || "").toLowerCase().includes(queryLower);

    return matchesStatus && matchesSearch;
  });

  // Calculate quick financial summary
  const totalVolume = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const successfulPayments = payments.filter((p) => (p.status || "").toLowerCase() === "success");
  const successVolume = successfulPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const avgTransactionSize =
    successfulPayments.length > 0 ? Math.round(successVolume / successfulPayments.length) : 0;

  // Export CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert("No transaction records to export.");
      return;
    }

    const headers = [
      "Payment ID",
      "Order ID",
      "Amount (INR)",
      "Status",
      "Gateway",
      "Client Name",
      "Client Email",
      "Client Phone",
      "Contractor Name",
      "Quote ID",
      "Timestamp",
    ];

    const rows = filteredPayments.map((p) => [
      p.paymentId || p.id,
      p.orderId || "N/A",
      p.amount || 0,
      p.status || "N/A",
      p.gateway || "Razorpay Test Mode",
      `"${p.clientName || "Customer"}"`,
      `"${p.clientEmail || ""}"`,
      `"${p.clientPhone || ""}"`,
      `"${p.workerName || "Contractor"}"`,
      p.quoteId || "N/A",
      p.createdAt || new Date().toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `razorpay_transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20 space-y-6">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-pro-md p-6 sm:p-8 shadow-card border border-slate-800 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Link
                  href="/admin"
                  className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-pro-sm transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Admin Center
                </Link>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-extrabold uppercase text-[10px] bg-emerald-500/20 px-2.5 py-0.5 rounded-pro-sm border border-emerald-500/30">
                  ⚡ Razorpay Test Mode Active
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-primary-400" />
                Financial Payments & Gateway Audit Vault
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Live monitoring of all client milestone payments, quote deposits, and transaction audit logs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="pro-btn-secondary px-4 py-2 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-subtle hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Export CSV Report
              </button>
            </div>
          </div>
        </div>

        {/* Active Payment Gateway Overview Card */}
        <div className="bg-white border border-indigo-100 rounded-pro-md p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-pro-sm bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Active Payment Gateway Infrastructure
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Primary Gateway: <strong className="text-emerald-600 font-extrabold">Razorpay (Test / Sandbox Active)</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-500 font-bold">Gateway Health:</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-pro-sm font-black text-[10px] uppercase flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Operational 100%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
            <div className="bg-slate-50 p-3 rounded-pro-sm border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Supported Payment Channels</span>
              <span className="font-extrabold text-slate-800 mt-1 block">
                UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-pro-sm border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Escrow Auto Release</span>
              <span className="font-extrabold text-emerald-600 mt-1 block">
                Enabled upon Customer 2-Way Signoff
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-pro-sm border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Instant Notifications</span>
              <span className="font-extrabold text-indigo-600 mt-1 block">
                Automated Customer & Pro Push Alerts
              </span>
            </div>
          </div>
        </div>

        {/* Hero Financial Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Volume Processed
            </span>
            <span className="text-xl font-black text-slate-900 font-mono tabular-nums mt-1 block">
              ₹{totalVolume.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Successful Transactions
            </span>
            <span className="text-xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
              {successfulPayments.length} Payments
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Average Order Value
            </span>
            <span className="text-xl font-black text-primary-600 font-mono tabular-nums mt-1 block">
              ₹{avgTransactionSize.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="pro-card bg-white border border-slate-200 p-4.5 rounded-pro-sm shadow-subtle">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Active Gateway Key
            </span>
            <span className="text-xs font-mono font-bold text-slate-700 mt-1 block truncate">
              rzp_test_TMW...
            </span>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="pro-card bg-white border border-slate-200 p-4 rounded-pro-md shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment ID, Client, Contractor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-pro-sm text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="pro-card bg-white border border-slate-200 rounded-pro-md shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-600" /> Live Transaction Ledger ({filteredPayments.length})
            </h3>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-16 p-6">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-60" />
              <h4 className="text-sm font-bold text-slate-800">No Payment Records Found</h4>
              <p className="text-xs text-slate-500 font-medium mt-1">
                When clients accept proposals or pay milestone deposits, their Razorpay transaction logs will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Transaction / Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Contractor</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => {
                    const statusLower = (p.status || "").toLowerCase();
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block text-xs">
                            {p.paymentId || p.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Order: {p.orderId || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{p.clientName || "Customer"}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{p.clientEmail || p.clientPhone || "—"}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">{p.workerName || "Contractor"}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-black font-mono tabular-nums text-slate-900 text-sm">
                            ₹{(Number(p.amount) || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-pro-sm border ${
                              statusLower === "success"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : statusLower === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {statusLower === "success" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {statusLower === "failed" && <XCircle className="w-3 h-3 text-rose-600" />}
                            {statusLower === "pending" && <Clock className="w-3 h-3 text-amber-600" />}
                            <span>{p.status || "Success"}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            className="pro-btn-secondary px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900"
                          >
                            View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Detail Receipt Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="pro-card bg-white border border-slate-200 rounded-pro-md p-6 max-w-md w-full shadow-float space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">Payment Audit Receipt</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-pro-sm border border-slate-200/80 space-y-1 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Payment ID</span>
                    <span className="font-bold text-slate-900">{selectedPayment.paymentId || selectedPayment.id}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Order ID</span>
                    <span className="font-bold text-slate-900">{selectedPayment.orderId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Gateway</span>
                    <span className="font-bold text-emerald-600">{selectedPayment.gateway || "Razorpay Test Mode"}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-bold text-slate-900">{selectedPayment.clientName || "Customer"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contractor / Worker</span>
                    <span className="font-bold text-slate-900">{selectedPayment.workerName || "Contractor"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-black font-mono text-slate-900 text-base">
                      ₹{(Number(selectedPayment.amount) || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
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
