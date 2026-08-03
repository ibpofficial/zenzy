"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  Calendar,
  FileText,
  Trash2,
  Check,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Filter,
  Sparkles,
  Info,
  Clock
} from "lucide-react";

interface NotifItem {
  id: string;
  userId: string;
  projectId?: string;
  title: string;
  text: string;
  read: boolean;
  type: string;
  linkUrl?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, userData, role, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verification" | "photos" | "milestones" | "meetings">("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: NotifItem[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as NotifItem);
        });
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notifications:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, authLoading]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((item) => {
        if (!item.read) {
          batch.update(doc(db, "notifications", item.id), { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((item) => {
        batch.delete(doc(db, "notifications", item.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getNotifCategory = (item: NotifItem) => {
    const textLower = (item.text || "").toLowerCase();
    const titleLower = (item.title || "").toLowerCase();
    const typeLower = (item.type || "").toLowerCase();

    if (
      typeLower.includes("photo") ||
      titleLower.includes("photo") ||
      textLower.includes("photo") ||
      textLower.includes("image")
    ) {
      return "photos";
    }
    if (
      typeLower.includes("verif") ||
      typeLower.includes("decision") ||
      titleLower.includes("verif") ||
      titleLower.includes("approval") ||
      textLower.includes("confirm") ||
      textLower.includes("approval") ||
      textLower.includes("action required")
    ) {
      return "verification";
    }
    if (
      typeLower.includes("milestone") ||
      typeLower.includes("stage") ||
      titleLower.includes("milestone") ||
      textLower.includes("stage") ||
      textLower.includes("phase")
    ) {
      return "milestones";
    }
    if (
      typeLower.includes("meeting") ||
      typeLower.includes("quote") ||
      titleLower.includes("meeting") ||
      titleLower.includes("quotation")
    ) {
      return "meetings";
    }
    return "general";
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "all") return true;
    const cat = getNotifCategory(item);
    return cat === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        
        {/* Header Title Section */}
        <div className="bg-[#0f2744] rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5" /> Project Activity & Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full animate-pulse">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Notifications & Verification Center
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                Track all project updates, uploaded site geo-photos, contractor approvals, milestone verifications, and payment releases tailored strictly for your account.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" /> Mark All Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-rose-400/30 transition flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Activity", icon: Bell, count: notifications.length },
              {
                id: "verification",
                label: "Action Required / Verifications",
                icon: AlertTriangle,
                count: notifications.filter((n) => getNotifCategory(n) === "verification").length
              },
              {
                id: "photos",
                label: "Geo Photos & Media",
                icon: Camera,
                count: notifications.filter((n) => getNotifCategory(n) === "photos").length
              },
              {
                id: "milestones",
                label: "Milestones & Stages",
                icon: Layers,
                count: notifications.filter((n) => getNotifCategory(n) === "milestones").length
              },
              {
                id: "meetings",
                label: "Meetings & Quotes",
                icon: Calendar,
                count: notifications.filter((n) => getNotifCategory(n) === "meetings").length
              }
            ].map((f) => {
              const Icon = f.icon;
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#0f2744] text-white shadow-md"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications Main List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 px-6 text-center space-y-3">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <BellRing className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">No Notifications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {filter === "all"
                  ? "You have no active project notifications or alerts at this moment."
                  : `No notifications found under the "${filter}" filter category.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const cat = getNotifCategory(item);
              const targetUrl = item.linkUrl || (item.projectId ? `/workspace/${item.projectId}` : null);
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  className={`p-5 transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                    isUnread ? "bg-amber-50/20 border-l-4 border-l-amber-500" : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm border ${
                        cat === "photos"
                          ? "bg-purple-50 text-purple-600 border-purple-200"
                          : cat === "verification"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : cat === "milestones"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : cat === "meetings"
                          ? "bg-blue-50 text-blue-600 border-blue-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {cat === "photos" && <Camera className="w-5 h-5" />}
                      {cat === "verification" && <AlertTriangle className="w-5 h-5" />}
                      {cat === "milestones" && <Layers className="w-5 h-5" />}
                      {cat === "meetings" && <Calendar className="w-5 h-5" />}
                      {cat === "general" && <Bell className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`font-extrabold text-sm text-slate-900 tracking-tight ${
                            isUnread ? "font-black" : ""
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isUnread && (
                          <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                            New Alert
                          </span>
                        )}
                        {item.projectId && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded">
                            Project ID: {item.projectId.substring(0, 8)}...
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                        {item.text}
                      </p>

                      <div className="flex items-center gap-4 text-[10.5px] text-slate-400 font-semibold pt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeAgo(item.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="capitalize text-slate-500 font-bold">{cat} Category</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right Column */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {targetUrl && (
                      <Link
                        href={targetUrl}
                        onClick={() => handleMarkAsRead(item.id)}
                        className="flex-1 sm:flex-none bg-[#0f2744] hover:bg-[#1e3a8a] text-white text-xs font-extrabold px-4 py-2 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Verify & Open Hub</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </Link>
                    )}

                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(item.id)}
                      className="bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
