"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProCustomer } from "@/lib/schema";
import { createProCustomer, updateProCustomer } from "@/lib/proSuite";
import {
  Users,
  Search,
  Plus,
  Star,
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  UserCheck,
  Briefcase
} from "lucide-react";

export default function ProCrmListPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<ProCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [favouriteOnly, setFavouriteOnly] = useState(false);
  const [repeatOnly, setRepeatOnly] = useState(false);

  // Create Customer Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCompany, setNewCustCompany] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustStatus, setNewCustStatus] = useState<ProCustomer["status"]>("lead");
  const [submitting, setSubmitting] = useState(false);

  // Sync Customers from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "pro_customers"),
      where("professionalId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ProCustomer[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ProCustomer);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setCustomers(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleToggleFavourite = async (e: React.MouseEvent, cust: ProCustomer) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateProCustomer(cust.id, { isFavourite: !cust.isFavourite });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCustName.trim()) return;

    setSubmitting(true);
    try {
      await createProCustomer({
        professionalId: user.uid,
        name: newCustName.trim(),
        email: newCustEmail.trim(),
        phone: newCustPhone.trim(),
        companyName: newCustCompany.trim() || undefined,
        city: newCustCity.trim() || undefined,
        status: newCustStatus
      });

      setModalOpen(false);
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
      setNewCustCompany("");
      setNewCustCity("");
      setNewCustStatus("lead");
    } catch (err) {
      console.error("Create customer error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Results
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesFav = !favouriteOnly || c.isFavourite;
    const matchesRepeat = !repeatOnly || c.isRepeat || (c.completedProjectsCount && c.completedProjectsCount >= 2);

    return matchesSearch && matchesStatus && matchesFav && matchesRepeat;
  });

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Customer CRM</span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
              Zenzy + Direct Clients
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage both Zenzy leads &amp; your own off-platform/direct clients in one unified business suite
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, email..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {["all", "lead", "active", "completed", "archived"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {st}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setFavouriteOnly(!favouriteOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              favouriteOnly
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favouriteOnly ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
            <span>Starred</span>
          </button>

          <button
            type="button"
            onClick={() => setRepeatOnly(!repeatOnly)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
              repeatOnly
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Repeat</span>
          </button>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading customers...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Customers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "No client records matched your current filters."
              : "Add your first customer record to begin tracking projects, quotes, and timeline history."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => (
            <Link
              key={c.id}
              href={`/business/dashboard/crm/${c.id}`}
              className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                    {c.companyName && (
                      <span className="text-xs text-slate-500 font-medium">({c.companyName})</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleFavourite(e, c)}
                    title={c.isFavourite ? "Starred Customer" : "Star Customer"}
                    className="text-slate-300 hover:text-amber-400 transition-colors p-1"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        c.isFavourite ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-slate-600 mb-3">
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                      c.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.status === "completed"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : c.status === "lead"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {c.status}
                  </span>

                  {(c.isRepeat || (c.completedProjectsCount && c.completedProjectsCount >= 2)) && (
                    <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5" /> Repeat Client
                    </span>
                  )}
                </div>

                <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View 360</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Create Customer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Add New Customer</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCustCompany}
                    onChange={(e) => setNewCustCompany(e.target.value)}
                    placeholder="e.g. Apex Builders"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    placeholder="e.g. Gurgaon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Status
                </label>
                <select
                  value={newCustStatus}
                  onChange={(e) => setNewCustStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                >
                  <option value="lead">Lead / Inquiry</option>
                  <option value="active">Active Customer</option>
                  <option value="completed">Completed Projects</option>
                  <option value="archived">Archived</option>
                </select>
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
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
