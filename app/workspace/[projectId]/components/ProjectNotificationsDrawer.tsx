"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileText,
  IndianRupee,
  Sparkles,
  CheckCheck,
  Clock,
  ArrowRight
} from "lucide-react";

interface ProjectNotificationsDrawerProps {
  projectId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function ProjectNotificationsDrawer({
  projectId,
  userId,
  isOpen,
  onClose,
  onNavigateTab,
}: ProjectNotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId || !userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        // Include notifications matching this projectId or general project notifications
        if (data.projectId === projectId || (!data.projectId && data.text?.includes(projectId))) {
          list.push({ id: d.id, ...data });
        }
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(list);
    });

    return () => unsub();
  }, [projectId, userId]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.filter((n) => !n.read).forEach((n) => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });
    try {
      await batch.commit();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-left">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                Project Notifications
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Real-time updates specifically for this workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Actions */}
        {notifications.length > 0 && (
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs font-semibold shrink-0">
            <span className="text-slate-600">
              {unreadCount > 0 ? (
                <strong className="text-blue-600">{unreadCount} New Unread</strong>
              ) : (
                "All Notifications Read"
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-20 space-y-3 text-slate-400">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                <Bell className="w-7 h-7" />
              </div>
              <p className="font-extrabold text-slate-700 text-sm">No Notifications Yet</p>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Schedule updates, decision requests, issue logs, and payment alerts for this project will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    handleMarkAsRead(item.id);
                    if (item.type === "project_dates" && onNavigateTab) {
                      onNavigateTab("overview");
                    } else if (item.type === "decision" && onNavigateTab) {
                      onNavigateTab("decisions");
                    }
                  }}
                  className={`p-4 rounded-xl border transition cursor-pointer space-y-2 relative ${
                    isUnread
                      ? "bg-blue-50/50 border-blue-200 shadow-subtle"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {isUnread && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  )}

                  <div className="flex justify-between items-start gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {item.text}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
                    <span>{new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                    <span className="text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>View Detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
