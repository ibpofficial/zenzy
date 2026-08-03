"use client";

import React from "react";
import Link from "next/link";
import { X, ExternalLink, ShieldCheck, Award, Calendar, Phone, Mail, MapPin, CheckCircle, AlertTriangle, Briefcase, FileText } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Pro360DrawerProps {
  pro: any;
  onClose: () => void;
  bookings?: any[];
  onUpdateStatus?: (newStatus: string) => void;
}

export default function Pro360Drawer({ pro, onClose, bookings = [], onUpdateStatus }: Pro360DrawerProps) {
  if (!pro) return null;

  const proAvatar = pro.avatar || pro.image || pro.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  const joinedDate = pro.createdAt ? new Date(pro.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Verified Partner";

  // Filter bookings assigned to this pro
  const proBookings = bookings.filter(b => b.workerId === pro.id || b.workerName === pro.name);
  const totalEarned = proBookings.filter(b => b.status === "Completed").reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const handleSetKycStatus = async (status: string) => {
    try {
      await updateDoc(doc(db, "workers", pro.id), { documentStatus: status });
      if (onUpdateStatus) onUpdateStatus(status);
      alert(`Professional KYC status updated to ${status.toUpperCase()}.`);
    } catch (err) {
      console.error(err);
      alert("Failed to update KYC status in database.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full p-6 overflow-y-auto space-y-6 shadow-2xl text-left border-l border-slate-200 animate-slide-in-right">
        {/* Header Bar */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={proAvatar}
              className="w-16 h-16 rounded-[6px] object-cover border border-slate-200 shadow-subtle shrink-0"
              alt=""
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#0f2744] text-amber-400">
                  SPECIALIST 360°
                </span>
                <span className="text-[9px] font-bold text-slate-400">ID: #{pro.id.slice(0, 8)}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{pro.name}</h3>
              <span className="text-xs text-slate-500 font-semibold">{pro.category || "Service Trade"} · Joined {joinedDate}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Public Profile Link Button */}
        <div className="flex gap-2">
          <Link
            href={`/worker/${pro.id}`}
            target="_blank"
            className="flex-1 bg-[#0f2744] hover:bg-[#1e3a8a] text-white py-2.5 rounded-[6px] text-xs font-extrabold uppercase tracking-wider text-center no-underline transition shadow-subtle flex items-center justify-center gap-2"
          >
            <span>Open Public Professional Profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>

        {/* Executive Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 p-3.5 rounded-[6px] border border-amber-200">
            <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Trust Score</span>
            <span className="text-xl font-black text-amber-900 leading-tight block mt-0.5">{pro.projectTrustScore || 92} / 100</span>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-[6px] border border-emerald-200">
            <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">KYC Status</span>
            <span className="text-xs font-black text-emerald-900 uppercase block mt-1">{pro.documentStatus || "approved"}</span>
          </div>
          <div className="bg-indigo-50 p-3.5 rounded-[6px] border border-indigo-200">
            <span className="text-[9px] font-extrabold uppercase text-indigo-800 block">Rating & Jobs</span>
            <span className="text-base font-black text-indigo-900 leading-tight block mt-0.5">{(pro.rating || 5.0).toFixed(1)} ★ ({proBookings.length} Jobs)</span>
          </div>
        </div>

        {/* Contact & Registration Information Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px] space-y-3">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-200 pb-1">
            ACCOUNT & COMPLIANCE RECORDS
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs font-medium">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Phone Number</span>
              <span className="font-mono font-bold text-slate-900">{pro.phone || "Not Listed"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Email Address</span>
              <span className="font-semibold text-slate-900">{pro.email || "No email"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">GST / Tax ID</span>
              <span className="font-mono font-semibold text-slate-900">{pro.gstNo || "GST Pending"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Service City</span>
              <span className="font-semibold text-slate-900">{pro.serviceArea || pro.city || "Pan India"}</span>
            </div>
          </div>
        </div>

        {/* Administrative KYC Decision Controls */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0f2744]" /> Identity & License Verification Actions
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleSetKycStatus("approved")}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] text-xs font-extrabold uppercase transition shadow-subtle cursor-pointer border-none"
            >
              ✓ Approve KYC Documents
            </button>
            <button
              onClick={() => handleSetKycStatus("rejected")}
              className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-[6px] text-xs font-extrabold uppercase transition shadow-subtle cursor-pointer border-none"
            >
              ✕ Reject KYC Verification
            </button>
          </div>
        </div>

        {/* Pro Activity & Booking Log (Last 5) */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Recent Assigned Jobs & Activity (Last 5 of {proBookings.length})
            </h4>
            <span className="text-xs font-black text-emerald-700">Total Earned: ₹{totalEarned.toLocaleString()}</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {proBookings.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] text-center text-slate-400 text-xs font-semibold">
                No bookings recorded for this specialist yet.
              </div>
            ) : (
              proBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-slate-900 block">{b.serviceName || b.title || "Service Request"}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{b.date} · Customer: {b.customerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block">₹{(b.price || 0).toLocaleString()}</span>
                    <span className={`text-[9px] font-black uppercase ${
                      b.status === "Completed" ? "text-emerald-700" : "text-amber-700"
                    }`}>{b.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
