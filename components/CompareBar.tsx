"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Scale, ArrowRight, Trash2, UserPlus, Minus } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CompareBar() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const loadProfiles = async (ids: string[]) => {
    try {
      const fetched: any[] = [];
      for (const id of ids) {
        const docSnap = await getDoc(doc(db, "workers", id));
        if (docSnap.exists()) {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        }
      }
      setProfiles(fetched);
    } catch (e) {
      console.error("Failed to load compare profiles:", e);
    }
  };

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem("zenzy_compare_ids");
      const ids = stored ? JSON.parse(stored) : [];
      setSelectedIds(ids);
      loadProfiles(ids);
    };

    handleUpdate();
    window.addEventListener("zenzy-compare-changed", handleUpdate);
    return () => {
      window.removeEventListener("zenzy-compare-changed", handleUpdate);
    };
  }, []);

  const handleRemove = (id: string) => {
    const nextIds = selectedIds.filter(x => x !== id);
    localStorage.setItem("zenzy_compare_ids", JSON.stringify(nextIds));
    setSelectedIds(nextIds);
    setProfiles(profiles.filter(p => p.id !== id));
    window.dispatchEvent(new CustomEvent("zenzy-compare-changed"));
  };

  const handleClear = () => {
    localStorage.setItem("zenzy_compare_ids", JSON.stringify([]));
    setSelectedIds([]);
    setProfiles([]);
    window.dispatchEvent(new CustomEvent("zenzy-compare-changed"));
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] w-[95%] max-w-4xl">
      <div className="relative bg-white/98 backdrop-blur-2xl text-slate-800 rounded-2xl shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35)] border border-white/60 ring-1 ring-slate-200/30 transition-all duration-300 hover:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.4)]">

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg transition-all flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          <Minus className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`} />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">

            {/* Left Section */}
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
              {/* Icon with Gradient */}
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-white" strokeWidth={2} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white text-[9px] font-black flex items-center justify-center shadow-md border-2 border-white">
                  {selectedIds.length}
                </span>
              </div>

              {/* Profile Chips with Glass Effect */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 px-0.5">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="group flex items-center gap-1.5 bg-slate-50/80 backdrop-blur-sm border border-slate-200/70 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 shrink-0 transition-all hover:bg-white hover:border-primary-200/80 hover:shadow-sm"
                  >
                    <div className="relative w-5 h-5 rounded-md overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                      <img
                        src={p.avatar || `https://ui-avatars.com/api/?name=${p.name}&background=6366f1&color=fff&size=20`}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="max-w-[70px] truncate font-semibold text-[10px]">{p.name.split(" ")[0]}</span>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="p-0.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50/80 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Placeholder Chips */}
                {Array.from({ length: Math.max(0, 3 - profiles.length) }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 border-2 border-dashed border-slate-300/50 px-2.5 py-1 rounded-lg text-[9px] font-medium text-slate-400 shrink-0 bg-slate-50/30"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Add</span>
                  </div>
                ))}
              </div>

              {/* Selection Count Badge - Desktop */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50/80 border border-primary-100/60 text-primary-700 text-[9px] font-bold shrink-0">
                <span>{selectedIds.length} of 3</span>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t border-slate-200/50 pt-2.5 sm:pt-0 sm:border-none">
              <button
                onClick={handleClear}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 hover:bg-red-50/80 transition-all"
              >
                <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="hidden xs:inline">Clear</span>
              </button>

              <div className="w-px h-6 bg-slate-200/60 hidden sm:block"></div>

              <button
                onClick={() => {
                  router.push(`/compare?ids=${selectedIds.join(",")}`);
                }}
                disabled={selectedIds.length < 2}
                className="relative group flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/35 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md disabled:hover:shadow-primary-500/25"
              >
                <span>Compare</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[8px] font-black min-w-[16px] text-center">
                  {selectedIds.length}
                </span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsed State Indicator */}
        {!isExpanded && (
          <div className="px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 flex items-center justify-center shrink-0">
                <Scale className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 text-white text-[7px] font-black flex items-center justify-center shadow-md border border-white">
                  {selectedIds.length}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-700">
                {selectedIds.length} professional{selectedIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => {
                router.push(`/compare?ids=${selectedIds.join(",")}`);
              }}
              disabled={selectedIds.length < 2}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-[9px] uppercase tracking-wider shadow-md shadow-primary-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Compare</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}