"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProCalendarEvent } from "@/lib/schema";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/proSuite";
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  DollarSign,
  Truck,
  Users,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function ProCalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ProCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // View State
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Event Creation State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProCalendarEvent["type"]>("site_visit");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync Events
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "pro_calendar_events"),
      where("professionalId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ProCalendarEvent[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProCalendarEvent));
      list.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setEvents(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setSubmitting(true);
    try {
      let color = "#3b82f6";
      if (type === "site_visit") color = "#0284c7";
      if (type === "meeting") color = "#6366f1";
      if (type === "payment_due" || type === "payment_received") color = "#10b981";
      if (type === "material_delivery") color = "#f97316";
      if (type === "customer_followup") color = "#8b5cf6";
      if (type === "warranty_reminder") color = "#f59e0b";

      await createCalendarEvent({
        professionalId: user.uid,
        title: title.trim(),
        type,
        startDate,
        endDate: startDate,
        customerName: customerName.trim() || undefined,
        notes: notes.trim() || undefined,
        color,
        source: "manual"
      });

      setModalOpen(false);
      setTitle("");
      setNotes("");
      setCustomerName("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this calendar event?")) return;
    try {
      await deleteCalendarEvent(id);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Events
  const filteredEvents = events.filter(
    (e) => activeFilter === "all" || e.type === activeFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <span>Universal Calendar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated schedule for site visits, meetings, material deliveries, CRM follow-ups & warranty tasks
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {[
          { id: "all", label: "All Events" },
          { id: "site_visit", label: "Site Visits" },
          { id: "meeting", label: "Meetings" },
          { id: "payment_due", label: "Payments" },
          { id: "material_delivery", label: "Deliveries" },
          { id: "customer_followup", label: "CRM Follow-ups" },
          { id: "warranty_reminder", label: "Warranty Reminders" }
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              activeFilter === f.id
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Schedule Feed View */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading schedule...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Scheduled Events</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your calendar is clear for this filter category. Add site visits, meetings, or customer follow-ups above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2.5 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: event.color || "#3b82f6" }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{event.title}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase">
                      {event.type.replace("_", " ")}
                    </span>
                    {event.source && event.source !== "manual" && (
                      <span className="bg-purple-50 text-purple-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-purple-200">
                        Synced from {event.source}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {event.startDate}
                    </span>
                    {event.customerName && (
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {event.customerName}
                      </span>
                    )}
                  </div>
                  {event.notes && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{event.notes}</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(event.id)}
                className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                title="Remove Event"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Event */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>Add Calendar Event</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Site Visit & Measurement Check"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="site_visit">Site Visit</option>
                    <option value="meeting">Client Meeting</option>
                    <option value="payment_due">Payment Due</option>
                    <option value="material_delivery">Material Delivery</option>
                    <option value="customer_followup">Customer Follow-up</option>
                    <option value="warranty_reminder">Warranty Reminder</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Vikram Seth"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional agenda or site instructions..."
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
                  {submitting ? "Saving..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
