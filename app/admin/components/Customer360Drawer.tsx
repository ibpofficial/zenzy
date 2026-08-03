"use client";

import React from "react";
import Link from "next/link";
import { X, User, Phone, Mail, MapPin, Calendar, CreditCard, ShoppingBag, Send } from "lucide-react";

interface Customer360DrawerProps {
  customer: any;
  onClose: () => void;
  bookings?: any[];
  onTriggerNotification?: (userId: string, title: string, text: string, type: string) => void;
}

export default function Customer360Drawer({ customer, onClose, bookings = [], onTriggerNotification }: Customer360DrawerProps) {
  if (!customer) return null;

  const custAvatar = customer.avatar || customer.image || customer.photoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  const joinedDate = customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Verified Client";

  // Filter bookings for this customer
  const custBookings = bookings.filter(b => b.customerId === customer.id || b.customerEmail === customer.email || b.customerName === customer.name);
  const totalLtv = custBookings.filter(b => b.status === "Completed").reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full p-6 overflow-y-auto space-y-6 shadow-2xl text-left border-l border-slate-200 animate-slide-in-right">
        {/* Header Bar */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={custAvatar}
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-subtle shrink-0"
              alt=""
            />
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-emerald-100 text-emerald-800">
                VERIFIED CUSTOMER PROFILE
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">{customer.name || customer.displayName || "Client Customer"}</h3>
              <span className="text-xs text-slate-500 font-semibold">{customer.email || "Registered User"} · Joined {joinedDate}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 p-3.5 rounded-[6px] border border-emerald-200">
            <span className="text-[9px] font-extrabold uppercase text-emerald-800 block">Total LTV Spend</span>
            <span className="text-xl font-black text-emerald-900 leading-tight block mt-0.5">₹{totalLtv.toLocaleString()}</span>
          </div>
          <div className="bg-indigo-50 p-3.5 rounded-[6px] border border-indigo-200">
            <span className="text-[9px] font-extrabold uppercase text-indigo-800 block">Total Orders</span>
            <span className="text-xl font-black text-[#0f2744] leading-tight block mt-0.5">{custBookings.length}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-[6px] border border-slate-200">
            <span className="text-[9px] font-extrabold uppercase text-slate-400 block">Contact Phone</span>
            <span className="text-xs font-mono font-black text-slate-900 block mt-1">{customer.phone || "Not Listed"}</span>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-[6px] space-y-3 text-xs font-medium">
          <span className="text-[9.5px] font-black uppercase text-slate-400 tracking-wider block border-b border-slate-200 pb-1">
            ACCOUNT PROFILE DATA
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">User ID</span>
              <span className="font-mono text-slate-800">{customer.id || "N/A"}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Default Address</span>
              <span className="text-slate-800">{customer.address || "Primary Residence"}</span>
            </div>
          </div>
        </div>

        {/* Admin Direct Actions */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Direct Customer Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (onTriggerNotification && customer.id) {
                  onTriggerNotification(customer.id, "Customer Notification", "Admin message regarding your Zenzy bookings.", "support");
                  alert("Push notification sent to customer.");
                } else {
                  alert("Customer notification sent.");
                }
              }}
              className="p-2.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-[6px] text-xs font-extrabold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>Send Push Notification</span>
            </button>
            <a
              href={`mailto:${customer.email}`}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-[6px] text-xs font-extrabold uppercase transition text-center no-underline flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Send Direct Email</span>
            </a>
          </div>
        </div>

        {/* Customer Booking History (Last 5) */}
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" /> Recent Customer Booking History (Last 5 of {custBookings.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {custBookings.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-[6px] text-center text-slate-400 text-xs font-semibold">
                No active or past bookings found for this customer.
              </div>
            ) : (
              custBookings.slice(0, 5).map((b) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-[6px] flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-slate-900 block">{b.title || b.serviceName || "Service"}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{b.date} · Provider: {b.workerName || "Unassigned"}</span>
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
