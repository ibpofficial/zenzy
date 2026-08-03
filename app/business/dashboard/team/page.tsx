"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProTeamMember, ProTeamAttendance } from "@/lib/schema";
import { addTeamMember, markTeamAttendance } from "@/lib/proSuite";
import {
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Briefcase,
  Phone,
  X,
  UserPlus
} from "lucide-react";

export default function ProTeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<ProTeamMember[]>([]);
  const [attendance, setAttendance] = useState<ProTeamAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Site Supervisor");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [payCycle, setPayCycle] = useState<ProTeamMember["payCycle"]>("monthly");
  const [submitting, setSubmitting] = useState(false);

  // Sync Members & Attendance
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qMembers = query(
      collection(db, "pro_team_members"),
      where("professionalId", "==", user.uid)
    );

    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const list: ProTeamMember[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProTeamMember));
      setMembers(list);
      setLoading(false);
    });

    const qAtt = query(
      collection(db, "pro_team_attendance"),
      where("professionalId", "==", user.uid),
      where("date", "==", selectedDate)
    );

    const unsubAtt = onSnapshot(qAtt, (snap) => {
      const list: ProTeamAttendance[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProTeamAttendance));
      setAttendance(list);
    });

    return () => {
      unsubMembers();
      unsubAtt();
    };
  }, [user, selectedDate]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setSubmitting(true);
    try {
      await addTeamMember({
        professionalId: user.uid,
        name: name.trim(),
        phone: phone.trim(),
        role: role.trim(),
        status: "active",
        salaryAmount: parseFloat(salaryAmount) || 0,
        payCycle,
        assignedProjectIds: []
      });

      setModalOpen(false);
      setName("");
      setPhone("");
      setSalaryAmount("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttendanceChange = async (memberId: string, status: ProTeamAttendance["status"]) => {
    if (!user) return;
    try {
      await markTeamAttendance({
        professionalId: user.uid,
        employeeId: memberId,
        date: selectedDate,
        status
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <span>Team & Staff Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage site supervisors, artisans, daily attendance check-ins, and salary pay cycles
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Date Selector for Attendance */}
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-800">Daily Attendance Tracker</span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
        />
      </div>

      {/* Staff List & Attendance Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading staff roster...</div>
      ) : members.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Staff Members Added</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add engineers, site foremen, or skilled workers to log attendance and assign projects.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Salary & Cycle</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Attendance ({selectedDate})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => {
                  const currentAtt = attendance.find((a) => a.employeeId === m.id);
                  const attStatus = currentAtt?.status || "absent";

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3 text-slate-600">{m.role}</td>
                      <td className="p-3 text-slate-800 font-medium">
                        ₹{m.salaryAmount?.toLocaleString()} / <span className="capitalize">{m.payCycle}</span>
                      </td>
                      <td className="p-3 text-slate-500">{m.phone || "—"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(["present", "absent", "half_day", "leave"] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleAttendanceChange(m.id, st)}
                              className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${
                                attStatus === st
                                  ? st === "present"
                                    ? "bg-emerald-600 text-white"
                                    : st === "absent"
                                    ? "bg-rose-600 text-white"
                                    : "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                            >
                              {st.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Add Staff Member</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Job Title</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Site Engineer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Salary (₹)</label>
                  <input
                    type="number"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Cycle</label>
                  <select
                    value={payCycle}
                    onChange={(e) => setPayCycle(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily Wage</option>
                  </select>
                </div>
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
                  {submitting ? "Saving..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
