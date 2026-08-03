"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProSupplier, ProMaterialPrice } from "@/lib/schema";
import { addSupplier, addMaterialPrice } from "@/lib/proSuite";
import {
  Truck,
  Plus,
  Search,
  DollarSign,
  Phone,
  Mail,
  Building,
  Layers,
  X,
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";

export default function ProSuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<ProSupplier[]>([]);
  const [prices, setPrices] = useState<ProMaterialPrice[]>([]);
  const [loading, setLoading] = useState(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"directory" | "prices" | "compare">("directory");

  // Supplier Modal State
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supCategories, setSupCategories] = useState("Cement, Steel, Plumbing");
  const [submittingSup, setSubmittingSup] = useState(false);

  // Material Price Modal State
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedSupId, setSelectedSupId] = useState("");
  const [matName, setMatName] = useState("");
  const [matUnit, setMatUnit] = useState("Bag");
  const [matPrice, setMatPrice] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);

  // Sync Data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qSup = query(
      collection(db, "pro_suppliers"),
      where("professionalId", "==", user.uid)
    );
    const unsubSup = onSnapshot(qSup, (snap) => {
      const list: ProSupplier[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProSupplier));
      setSuppliers(list);
      setLoading(false);
    });

    const qPrice = query(
      collection(db, "pro_material_prices"),
      where("professionalId", "==", user.uid)
    );
    const unsubPrice = onSnapshot(qPrice, (snap) => {
      const list: ProMaterialPrice[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProMaterialPrice));
      setPrices(list);
    });

    return () => {
      unsubSup();
      unsubPrice();
    };
  }, [user]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supName.trim()) return;

    setSubmittingSup(true);
    try {
      const categories = supCategories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      await addSupplier({
        professionalId: user.uid,
        name: supName.trim(),
        phone: supPhone.trim(),
        email: supEmail.trim() || undefined,
        categories
      });

      setSupplierModalOpen(false);
      setSupName("");
      setSupPhone("");
      setSupEmail("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSup(false);
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSupId || !matName.trim() || !matPrice) return;

    setSubmittingPrice(true);
    try {
      const sup = suppliers.find((s) => s.id === selectedSupId);
      await addMaterialPrice({
        professionalId: user.uid,
        supplierId: selectedSupId,
        supplierName: sup?.name,
        materialName: matName.trim(),
        unit: matUnit.trim(),
        price: parseFloat(matPrice) || 0,
        effectiveDate: new Date().toISOString().split("T")[0]
      });

      setPriceModalOpen(false);
      setMatName("");
      setMatPrice("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingPrice(false);
    }
  };

  // Unique Materials for Comparison
  const uniqueMaterialNames = Array.from(new Set(prices.map((p) => p.materialName.toLowerCase())));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span>Supplier & Material Cost Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Maintain supplier directory, track material price updates, and compare costs side-by-side
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSupplierModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
          <button
            type="button"
            onClick={() => setPriceModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <DollarSign className="w-4 h-4" />
            <span>Log Price</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: "directory", label: "Supplier Directory", count: suppliers.length },
          { id: "prices", label: "Material Prices Log", count: prices.length },
          { id: "compare", label: "Price Comparison Matrix", count: uniqueMaterialNames.length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content Views */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {suppliers.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No suppliers added yet. Click "Add Supplier" above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    <Building className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    {s.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.email}</span>
                      </div>
                    )}
                  </div>

                  {s.categories && s.categories.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-2 border-t border-slate-100">
                      {s.categories.map((c) => (
                        <span key={c} className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "prices" && (
        <div className="space-y-4">
          {prices.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No material prices logged yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-[10px] text-slate-900">
                  <tr>
                    <th className="p-3">Material Name</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Price</th>
                    <th className="p-3 text-right">Effective Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prices.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-bold text-slate-900">{p.materialName}</td>
                      <td className="p-3 text-slate-600">{p.supplierName}</td>
                      <td className="p-3 text-slate-500">{p.unit}</td>
                      <td className="p-3 font-bold text-emerald-700">₹{p.price?.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-400">{p.effectiveDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Side-by-Side Material Price Comparison</span>
          </h3>

          {uniqueMaterialNames.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              Log material prices across multiple suppliers to see comparison matrix.
            </div>
          ) : (
            <div className="space-y-4">
              {uniqueMaterialNames.map((mat) => {
                const matPrices = prices.filter((p) => p.materialName.toLowerCase() === mat);
                const lowestPrice = Math.min(...matPrices.map((p) => p.price));

                return (
                  <div key={mat} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm capitalize">{mat}</h4>
                      <span className="text-xs text-slate-500">
                        {matPrices.length} Supplier Quotes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {matPrices.map((p) => (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            p.price === lowestPrice
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                              : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{p.supplierName}</span>
                            {p.price === lowestPrice && (
                              <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-xs">
                                Lowest Cost
                              </span>
                            )}
                          </div>
                          <div className="text-base font-extrabold">
                            ₹{p.price?.toLocaleString()} <span className="text-xs font-normal">/ {p.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Supplier */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Add Supplier Record</span>
              </h3>
              <button
                type="button"
                onClick={() => setSupplierModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Dealer Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. UltraTech Cement Depot"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categories (Comma-separated)</label>
                <input
                  type="text"
                  value={supCategories}
                  onChange={(e) => setSupCategories(e.target.value)}
                  placeholder="Cement, Tiling, Electrical"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSup}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  {submittingSup ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Material Price */}
      {priceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>Log Material Price</span>
              </h3>
              <button
                type="button"
                onClick={() => setPriceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPrice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
                <select
                  required
                  value={selectedSupId}
                  onChange={(e) => setSelectedSupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">Choose supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material Name *</label>
                <input
                  type="text"
                  required
                  value={matName}
                  onChange={(e) => setMatName(e.target.value)}
                  placeholder="e.g. PPC Cement 50kg Bag"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={matUnit}
                    onChange={(e) => setMatUnit(e.target.value)}
                    placeholder="Bag / Sq.Ft / Ton"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={matPrice}
                    onChange={(e) => setMatPrice(e.target.value)}
                    placeholder="380"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPriceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPrice}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs"
                >
                  {submittingPrice ? "Saving..." : "Log Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
