"use client";

import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

interface AvailabilityCalendarProps {
  workerId: string;
}

export default function AvailabilityCalendar({ workerId }: AvailabilityCalendarProps) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!workerId) return;

    const unsub = onSnapshot(doc(db, "workers", workerId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBlockedDates(data.blockedDates || []);
      }
      setLoading(false);
    }, (err) => {
      console.error("Failed to sync calendar blocks:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [workerId]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-3 text-slate-400 text-xs font-semibold">
        <span className="w-4 h-4 border border-slate-350 border-t-transparent rounded animate-spin mr-2"></span>
        Loading availability...
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
    <div className="w-full text-left space-y-3">
      {/* Dropdown Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-lg flex items-center justify-between text-xs font-bold text-slate-805 transition cursor-pointer shadow-2xs"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-550" />
          <span>Availability Calendar Preview</span>
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200/60">
            {isOpen ? "Hide" : "Expand"}
          </span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="w-full border border-slate-200 p-4 rounded-lg bg-slate-50/20 shadow-2xs animate-fade-in space-y-4">
          {/* Calendar Header controls */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              Select Month:
            </h4>
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-slate-805 uppercase min-w-[80px] text-center">
                {monthNames[month]} {year}
              </span>
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400 mb-2">
            {dayHeaders.map(day => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysList.map((item, idx) => {
              if (item === null) {
                return <div key={`empty-${idx}`} className="py-2.5"></div>;
              }

              const isToday = new Date().toDateString() === new Date(item.dateString).toDateString();

              return (
                <div
                  key={item.dateString}
                  className={`py-2.5 rounded-lg text-[11px] font-bold relative flex flex-col items-center justify-center border transition-all ${
                    item.isBlocked 
                      ? "bg-amber-50/70 border-amber-200/50 text-amber-700"
                      : "bg-emerald-50/30 border-emerald-100/50 text-emerald-800"
                  } ${isToday ? "ring-2 ring-primary-500/20" : ""}`}
                >
                  <span>{item.day}</span>
                  <span className={`w-1.5 h-1.5 rounded mt-1 ${
                    item.isBlocked ? "bg-amber-500" : "bg-emerald-500"
                  }`} />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100 text-[9.5px] font-bold text-slate-405">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              <span>Booked / Blocked</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
