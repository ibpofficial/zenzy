"use client";

import React, { useState } from "react";
import { MaterialEntry } from "@/lib/schema";
import {
  Package,
  Plus,
  Truck,
  FileText,
  IndianRupee,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface MaterialTrackingTabProps {
  materials: MaterialEntry[];
  isClient: boolean;
  onAddMaterial: (mat: Partial<MaterialEntry>) => Promise<void>;
}

export default function MaterialTrackingTab({
  materials,
  isClient,
  onAddMaterial,
}: MaterialTrackingTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [itemName, setItemName] = useState("Tiles (60x60 cm)");
  const [unit, setUnit] = useState("Boxes");
  const [reqQty, setReqQty] = useState(150);
  const [delQty, setDelQty] = useState(110);
  const [usedQty, setUsedQty] = useState(80);
  const [cost, setCost] = useState(45000);
  const [supplierName, setSupplierName] = useState("Kajaria Ceramics Outlet");
  const [supplierPhone, setSupplierPhone] = useState("+91 98765 43210");
  const [invoiceRef, setInvoiceRef] = useState("INV-TILE-2026-88");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const remaining = Math.max(0, delQty - usedQty);

      const payload: Partial<MaterialEntry> = {
        itemName: itemName.trim(),
        unit: unit.trim(),
        requiredQuantity: Number(reqQty),
        deliveredQuantity: Number(delQty),
        usedQuantity: Number(usedQty),
        remainingQuantity: remaining,
        cost: Number(cost),
        quantity: Number(delQty),
        supplierName: supplierName.trim(),
        supplierPhone: supplierPhone.trim(),
        invoiceRef: invoiceRef.trim(),
        deliveryDate: deliveryDate,
        purchasedAt: new Date().toISOString(),
      };

      await onAddMaterial(payload);
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding material:", err);
      alert("Failed to save material log.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-indigo-400/30">
              📦 MATERIAL INVENTORY LOG
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {materials.length} Tracked Material Items
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Material Inventory & Supplier Ledger
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Real-time balance of required, delivered, used, and remaining construction materials.
          </p>
        </div>

        {!isClient && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? "Cancel Form" : "Add Material Entry"}</span>
          </button>
        )}
      </div>

      {/* ADD MATERIAL FORM */}
      {showAddForm && !isClient && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border-2 border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4"
        >
          <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-3">
            Add Material Tracking Entry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Item Name *</label>
              <input
                type="text"
                required
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Unit (e.g. Boxes, Tons, Bags)</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Total Cost (₹)</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Required Qty</label>
              <input
                type="number"
                required
                value={reqQty}
                onChange={(e) => setReqQty(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Delivered Qty</label>
              <input
                type="number"
                required
                value={delQty}
                onChange={(e) => setDelQty(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Used Qty</label>
              <input
                type="number"
                required
                value={usedQty}
                onChange={(e) => setUsedQty(Number(e.target.value))}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Delivery Date</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 block mb-1 font-bold">Supplier Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Supplier Phone</label>
              <input
                type="text"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 block mb-1 font-bold">Invoice / Ref No.</label>
              <input
                type="text"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold uppercase rounded-lg shadow-md cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Material Entry"}
            </button>
          </div>
        </form>
      )}

      {/* MATERIAL TRACKING TABLE CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" /> Material Ledger ({materials.length} Items)
          </h3>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12 p-6">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No Material Entries Recorded</h4>
            <p className="text-xs text-slate-500 mt-1">
              Add tiles, cement, electrical components, or fixtures to track inventory balances.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Material Item</th>
                  <th className="py-3 px-4 text-center">Required</th>
                  <th className="py-3 px-4 text-center">Delivered</th>
                  <th className="py-3 px-4 text-center">Used</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4">Supplier & Invoice</th>
                  <th className="py-3 px-4 text-right">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {materials.map((m) => {
                  const req = m.requiredQuantity || m.quantity || 100;
                  const del = m.deliveredQuantity || m.quantity || 0;
                  const used = m.usedQuantity || 0;
                  const rem = m.remainingQuantity ?? Math.max(0, del - used);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 block text-xs">{m.itemName}</span>
                        <span className="text-[10px] text-slate-500 block">{m.unit || "Units"}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {req}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-sky-700 bg-sky-50/40">
                        {del}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-700 bg-indigo-50/40">
                        {used}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-black text-emerald-700 bg-emerald-50/40">
                        {rem}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block text-[11px]">
                          {m.supplierName || "Direct Procurement"}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          {m.supplierPhone && <span>📞 {m.supplierPhone}</span>}
                          {m.invoiceRef && <span className="font-mono text-indigo-600">Ref: {m.invoiceRef}</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900 text-sm">
                        ₹{(m.cost || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
