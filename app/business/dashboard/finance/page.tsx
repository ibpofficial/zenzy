"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Invoice, ProExpense } from "@/lib/schema";
import { logExpense } from "@/lib/proSuite";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  FileText,
  PieChart,
  Calendar,
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function ProFinancePage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<ProExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Materials");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);

  // Sync Invoices & Expenses
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qInv = query(
      collection(db, "invoices"),
      where("workerId", "==", user.uid)
    );

    const unsubInv = onSnapshot(qInv, (snap) => {
      const list: Invoice[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Invoice));
      setInvoices(list);
      setLoading(false);
    });

    const qExp = query(
      collection(db, "pro_expenses"),
      where("professionalId", "==", user.uid)
    );

    const unsubExp = onSnapshot(qExp, (snap) => {
      const list: ProExpense[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProExpense));
      list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      setExpenses(list);
    });

    return () => {
      unsubInv();
      unsubExp();
    };
  }, [user]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim() || !amount) return;

    setSubmitting(true);
    try {
      await logExpense({
        professionalId: user.uid,
        description: description.trim(),
        amount: parseFloat(amount) || 0,
        category,
        date
      });

      setModalOpen(false);
      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations
  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const pendingPayments = invoices
    .filter((i) => i.status === "Sent" || i.status === "Draft" || i.status === "Overdue")
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span>Finance & Cash Flow</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track gross revenue, material & site expenses, net profit, pending invoices, and monthly summaries
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Expense</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Collected Revenue</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">₹{totalRevenue.toLocaleString()}</div>
          <p className="text-[10px] text-emerald-700 font-medium">From paid invoices</p>
        </div>

        <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200/80 space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Total Expenses</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-950">₹{totalExpenses.toLocaleString()}</div>
          <p className="text-[10px] text-rose-700 font-medium">Material, labor & overheads</p>
        </div>

        <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200/80 space-y-1">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
            <span>Net Profit</span>
            <PieChart className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-blue-950">₹{netProfit.toLocaleString()}</div>
          <p className="text-[10px] text-blue-700 font-medium">Revenue − Expenses</p>
        </div>

        <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Pending Payments</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-950">₹{pendingPayments.toLocaleString()}</div>
          <p className="text-[10px] text-amber-700 font-medium">Unpaid client invoices</p>
        </div>
      </div>

      {/* Expenses & Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-600" />
            <span>Recent Logged Expenses</span>
          </h3>

          {expenses.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No expenses logged yet.</div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{exp.description}</div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-xs">
                      {exp.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-600">− ₹{exp.amount?.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{exp.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoices Tracker */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Invoice Tracker</span>
          </h3>

          {invoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No invoices created yet.</div>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                    <p className="text-[11px] text-slate-500">{inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{inv.grandTotal?.toLocaleString()}</div>
                    <span
                      className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-xs ${
                        inv.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Log Expense */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>Log Business Expense</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cement & Tiles Batch Purchase"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="45000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Materials">Materials</option>
                    <option value="Labor">Labor Wages</option>
                    <option value="Transport">Transport / Logistics</option>
                    <option value="Tools">Tools & Equipment</option>
                    <option value="Overheads">Office Overheads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
