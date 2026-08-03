"use client";

import React, { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, ChevronLeft, ChevronRight, X, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface CalendarEditorProps {
  workerId: string;
}

interface AvailabilityBlock {
  id: string;
  startDate: string;
  endDate: string;
  type: "manual" | "project";
  note?: string;
}

export default function CalendarEditor({ workerId }: CalendarEditorProps) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const [noteInput, setNoteInput] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"available" | "limited" | "busy">("available");

  useEffect(() => {
    if (!workerId) return;

    // 1. Sync worker metadata (blockedDates array and status)
    const unsubWorker = onSnapshot(doc(db, "workers", workerId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBlockedDates(data.blockedDates || []);
        setSelectedStatus(data.availabilityStatus || "available");
      }
    });

    // 2. Sync rich blocks subcollection
    const qBlocks = collection(db, "workers", workerId, "availabilityBlocks");
    const unsubBlocks = onSnapshot(qBlocks, (snap) => {
      const list: AvailabilityBlock[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() as Omit<AvailabilityBlock, 'id'> });
      });
      setBlocks(list);
      setLoading(false);
    });

    return () => {
      unsubWorker();
      unsubBlocks();
    };
  }, [workerId]);

  // Calendar math
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Date block toggler
  const handleDateClick = async (dateStr: string) => {
    if (loading) return;

    const workerRef = doc(db, "workers", workerId);
    let nextBlocked = [...blockedDates];

    if (nextBlocked.includes(dateStr)) {
      // Unblock date: remove from flattened array
      nextBlocked = nextBlocked.filter(d => d !== dateStr);
      await updateDoc(workerRef, { blockedDates: nextBlocked });

      // Clean up linked manual blocks from subcollection if single date block matches
      const q = query(
        collection(db, "workers", workerId, "availabilityBlocks"),
        where("startDate", "==", dateStr),
        where("type", "==", "manual")
      );
      const snap = await getDocs(q);
      snap.forEach(async (docSnap) => {
        await deleteDoc(doc(db, "workers", workerId, "availabilityBlocks", docSnap.id));
      });
    } else {
      // Block date: add to flattened array
      nextBlocked.push(dateStr);
      await updateDoc(workerRef, { blockedDates: nextBlocked });

      // Create manual block subcollection entry
      const blockPayload = {
        startDate: dateStr,
        endDate: dateStr,
        type: "manual",
        note: noteInput.trim() || "Manual calendar block",
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, "workers", workerId, "availabilityBlocks"), blockPayload);
      setNoteInput("");
    }
  };

  // Delete manual block list item
  const handleDeleteBlock = async (block: AvailabilityBlock) => {
    try {
      // 1. Delete document from subcollection
      await deleteDoc(doc(db, "workers", workerId, "availabilityBlocks", block.id));

      // 2. Remove all dates covered by this block range from flattened array
      const dateList: string[] = [];
      const start = new Date(block.startDate);
      const end = new Date(block.endDate);
      let curr = new Date(start);
      while (curr <= end) {
        dateList.push(curr.toISOString().split("T")[0]);
        curr.setDate(curr.getDate() + 1);
      }

      const nextBlocked = blockedDates.filter(d => !dateList.includes(d));
      await updateDoc(doc(db, "workers", workerId), {
        blockedDates: nextBlocked
      });
    } catch (e) {
      console.error("Failed to delete block:", e);
    }
  };

  // Update general status
  const handleStatusChange = async (newStatus: "available" | "limited" | "busy") => {
    setSelectedStatus(newStatus);
    try {
      await updateDoc(doc(db, "workers", workerId), {
        availabilityStatus: newStatus
      });
      alert(`General status set to: ${newStatus.toUpperCase()}`);
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 text-xs font-semibold">
        <span className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-lg animate-spin mr-2"></span>
        Loading calendar schedule editor...
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const daysList = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysList.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    daysList.push({
      day: d,
      dateString: dStr,
      isBlocked: blockedDates.includes(dStr)
    });
  }

  return (
    <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-lg shadow-xs space-y-6 text-left w-full">
      
      {/* Header */}
      <div>
        <h3 className="font-extrabold text-base uppercase tracking-wider text-slate-900">Availability Schedule Manager</h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Toggle date blockouts, write custom blocker notes, and change your general availability status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-slate-100 w-full">
        
        {/* 1. Left side - Calendar editor (7 columns) */}
        <div className="lg:col-span-7 space-y-6 text-left w-full">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Interactive Date Blocker</h4>
              <p className="text-[10px] text-slate-400 font-semibold">Click days below to toggle booking blocks.</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-xs font-black text-slate-805 uppercase min-w-[100px] text-center">
                {monthNames[month]} {year}
              </span>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Input for custom note */}
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-405 font-black uppercase tracking-wider block">Custom block note (set before clicking dates)</label>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="e.g. Leave for family trip, Personal work..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none text-xs font-semibold focus:border-primary-500"
            />
          </div>

          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black uppercase text-slate-400 mb-2">
              {dayHeaders.map(day => (
                <div key={day} className="py-1">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysList.map((item, idx) => {
                if (item === null) {
                  return <div key={`empty-${idx}`} className="py-4"></div>;
                }

                const isToday = new Date().toDateString() === new Date(item.dateString).toDateString();

                return (
                  <button
                    key={item.dateString}
                    type="button"
                    onClick={() => handleDateClick(item.dateString)}
                    className={`py-4.5 rounded-lg text-xs font-black relative flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      item.isBlocked 
                        ? "bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100/70"
                        : "bg-emerald-50/20 border-emerald-100/50 text-emerald-805 hover:bg-emerald-50"
                    } ${isToday ? "ring-2 ring-primary-550" : ""}`}
                  >
                    <span>{item.day}</span>
                    <span className={`w-1.5 h-1.5 rounded mt-1.5 ${
                      item.isBlocked ? "bg-rose-500" : "bg-emerald-500"
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Right side - Blocks Manager (5 columns) */}
        <div className="lg:col-span-5 space-y-6 text-left w-full">
          
          {/* Availability Status selector */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-450">General Status</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "available", label: "Available", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                { id: "limited", label: "Limited", color: "bg-amber-50 text-amber-700 border-amber-250" },
                { id: "busy", label: "Busy/Full", color: "bg-rose-50 text-rose-700 border-rose-200" }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStatusChange(st.id as any)}
                  className={`p-3 rounded-lg border text-center text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center ${
                    selectedStatus === st.id 
                      ? st.color + " ring-2 ring-indigo-500/10 scale-98" 
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <span>{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Existing Blocks List */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-455">Active Booking Blocks ({blocks.length})</h4>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {blocks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No dates blocked currently.</p>
              ) : (
                blocks.map((block) => (
                  <div key={block.id} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg flex items-center justify-between text-xs">
                    <div className="space-y-1 pr-2">
                      <span className="font-extrabold text-slate-900 block truncate max-w-[180px]">{block.note}</span>
                      <span className="text-[10px] text-slate-450 font-semibold block">
                        {block.startDate === block.endDate 
                          ? block.startDate 
                          : `${block.startDate} to ${block.endDate}`
                        }
                      </span>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${
                        block.type === 'project' ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"
                      }`}>
                        {block.type}
                      </span>
                    </div>
                    {block.type === 'manual' && (
                      <button
                        onClick={() => handleDeleteBlock(block)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-650 transition cursor-pointer"
                        title="Delete block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
