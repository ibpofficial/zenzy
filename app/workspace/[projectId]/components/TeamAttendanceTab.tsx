"use client";

import React, { useState } from "react";
import { ProjectTeamMember } from "@/lib/schema";
import { Users, Clock, Plus, CheckCircle2, UserCheck, Phone } from "lucide-react";

interface TeamAttendanceTabProps {
  teamMembers: ProjectTeamMember[];
  isClient: boolean;
  onAddTeamMember: (member: Partial<ProjectTeamMember>) => Promise<void>;
  onLogAttendance: (memberId: string, log: { inTime: string; outTime: string; hoursWorked: number; todayWork: string }) => Promise<void>;
}

export default function TeamAttendanceTab({
  teamMembers,
  isClient,
  onAddTeamMember,
  onLogAttendance,
}: TeamAttendanceTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loggingForMember, setLoggingForMember] = useState<ProjectTeamMember | null>(null);

  // New Worker Form
  const [workerName, setWorkerName] = useState("Raj Sharma");
  const [workerRole, setWorkerRole] = useState("Electrician");
  const [workerPhone, setWorkerPhone] = useState("+91 98123 45678");

  // Attendance Form
  const [inTime, setInTime] = useState("09:10 AM");
  const [outTime, setOutTime] = useState("06:15 PM");
  const [hours, setHours] = useState(8);
  const [todayWork, setTodayWork] = useState("Conduit wiring & switchboard fixing in kitchen");

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAddTeamMember({
        name: workerName.trim(),
        role: workerRole.trim(),
        phone: workerPhone.trim(),
        verified: true,
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding worker:", err);
    }
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingForMember) return;
    try {
      await onLogAttendance(loggingForMember.id, {
        inTime,
        outTime,
        hoursWorked: Number(hours),
        todayWork: todayWork.trim(),
      });
      setLoggingForMember(null);
    } catch (err) {
      console.error("Error saving attendance:", err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-indigo-400/30">
              👷 TEAM & ATTENDANCE AUDIT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {teamMembers.length} Workers Registered
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
            Site Team & Worker Daily Attendance
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Log worker IN/OUT hours, electrician/plumber trades, and assigned daily tasks.
          </p>
        </div>

        {!isClient && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* WORKER ATTENDANCE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((w) => {
          const latestLog = w.attendanceLog && w.attendanceLog.length > 0 ? w.attendanceLog[w.attendanceLog.length - 1] : null;

          return (
            <div key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{w.name}</h3>
                    <span className="text-xs font-bold text-indigo-600 block">{w.role}</span>
                  </div>
                </div>

                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Attendance Details */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs font-semibold">
                <div className="flex justify-between items-center text-slate-700 font-mono">
                  <span>IN: <strong className="text-emerald-700">{latestLog?.inTime || "9:10 AM"}</strong></span>
                  <span>OUT: <strong className="text-rose-700">{latestLog?.outTime || "6:15 PM"}</strong></span>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-black">
                    {latestLog?.hoursWorked || 8} Hours
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Today's Work</span>
                  <p className="text-xs font-bold text-slate-800 line-clamp-2 mt-0.5">
                    {latestLog?.todayWork || w.assignedWork || "Electrical wiring & switchbox installation"}
                  </p>
                </div>
              </div>

              {!isClient && (
                <button
                  type="button"
                  onClick={() => setLoggingForMember(w)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Log Attendance & Work</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ADD MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-3">
              Register New Worker / Team Member
            </h3>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="text-slate-700 block mb-1 font-bold">Worker Name *</label>
                <input
                  type="text"
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Trade / Role *</label>
                <input
                  type="text"
                  required
                  value={workerRole}
                  onChange={(e) => setWorkerRole(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Phone Number</label>
                <input
                  type="text"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold uppercase rounded-lg shadow-md"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG ATTENDANCE MODAL */}
      {loggingForMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase border-b border-slate-100 pb-3">
              Log Attendance for {loggingForMember.name}
            </h3>

            <form onSubmit={handleAttendanceSubmit} className="space-y-3 text-xs font-semibold">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-bold">IN Time</label>
                  <input
                    type="text"
                    required
                    value={inTime}
                    onChange={(e) => setInTime(e.target.value)}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">OUT Time</label>
                  <input
                    type="text"
                    required
                    value={outTime}
                    onChange={(e) => setOutTime(e.target.value)}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1 font-bold">Hours</label>
                  <input
                    type="number"
                    required
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-bold">Today's Assigned / Completed Work</label>
                <textarea
                  rows={3}
                  required
                  value={todayWork}
                  onChange={(e) => setTodayWork(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2.5 outline-none font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setLoggingForMember(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold uppercase rounded-lg shadow-md"
                >
                  Submit Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
