"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  Shield,
  Home,
  Briefcase,
  Building,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  CreditCard,
  ShoppingBag,
  ChevronRight,
  ChevronLeft,
  CheckCheck,
  Trash2,
  BellRing,
  Info,
  Package,
  AlertCircle,
  Settings,
  UserCircle,
  HelpCircle,
  Award,
  Grid
} from "lucide-react";
import AllAppsModal from "./AllAppsModal";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Notification type config ─────────────────────────────────────────────────
const NOTIF_TYPES: Record<string, { icon: React.ElementType; accent: string; bg: string; label: string }> = {
  booking: { icon: Calendar, accent: "bg-emerald-500", bg: "bg-emerald-50", label: "Booking" },
  message: { icon: MessageSquare, accent: "bg-primary-500", bg: "bg-primary-50", label: "Message" },
  support: { icon: MessageSquare, accent: "bg-primary-500", bg: "bg-primary-50", label: "Support" },
  payment: { icon: CreditCard, accent: "bg-amber-400", bg: "bg-amber-50", label: "Payment" },
  subscription: { icon: CreditCard, accent: "bg-amber-400", bg: "bg-amber-50", label: "Subscription" },
  order: { icon: Package, accent: "bg-teal-500", bg: "bg-teal-50", label: "Order" },
  system: { icon: Info, accent: "bg-slate-400", bg: "bg-slate-100", label: "System" },
  alert: { icon: AlertCircle, accent: "bg-rose-500", bg: "bg-rose-50", label: "Alert" },
};

function getNotifConfig(type: string) {
  return NOTIF_TYPES[type] ?? NOTIF_TYPES["system"];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Navbar({ isProfileView = false, minimal = false }: { isProfileView?: boolean; minimal?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, role, isAdmin, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pushBannerVisible, setPushBannerVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [allAppsOpen, setAllAppsOpen] = useState(false);

  // ── Scroll hide/show (desktop only) ────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (window.innerWidth < 768) { lastScrollY.current = y; return; }
      setShowNavbar(y <= lastScrollY.current || y <= 80);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Close dropdowns on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        if (window.innerWidth >= 768) setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Site config ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // ── Notifications listener (Optimized to limit memory & data overhead) ─────
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const items: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.userId === user.uid || data.userId === "all" || (user.email && data.userId === user.email)) {
          items.push({ id: d.id, ...data });
        }
      });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items.slice(0, 30));
    });
    return () => unsub();
  }, [user]);

  // ── Push permission banner & auto-subscribe ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      import("@/lib/pushNotifications").then(({ subscribeToPush }) => {
        subscribeToPush(user.uid);
      });
    } else if (Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("zenzy_push_dismissed");
      if (!dismissed) setPushBannerVisible(true);
    }
  }, [user]);

  // ── Notification actions ─────────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch { }
  };
  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.filter((n) => !n.read).forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    try { await batch.commit(); } catch { }
  };
  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    try { for (const n of notifications) await deleteDoc(doc(db, "notifications", n.id)); } catch { }
    setNotifications([]);
  };

  // ── Push permission request ──────────────────────────────────────────────────
  const handleEnablePush = async () => {
    setPushBannerVisible(false);
    sessionStorage.setItem("zenzy_push_dismissed", "1");
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const { subscribeToPush } = await import("@/lib/pushNotifications");
      await subscribeToPush(user!.uid);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const links = [
    { name: "Home", href: "/", icon: "fa-home" },
    { name: "Start Your Project", href: "/services", icon: "fa-rocket" },
    { name: "Rent Properties", href: "/rent", icon: "fa-house-chimney" },
    { name: "About", href: "/about", icon: "fa-info-circle" },
    { name: "Contact", href: "/contact", icon: "fa-envelope" },
  ];

  const getDashboardPath = () => (role === "worker" ? "/worker/dashboard" : "/dashboard");

  return (
    <>
      {/* ── Announcement Bar ─────────────────────────────────────────────── */}
      {siteConfig?.showAnnouncement && siteConfig?.announcementBar && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 text-[11px] font-extrabold tracking-wide announcement-container">
          <div className="announcement-scroll whitespace-nowrap">{siteConfig.announcementBar}</div>
        </div>
      )}

      {/* ── Push Permission Banner ───────────────────────────────────────── */}
      {pushBannerVisible && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-md animate-slide-up">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-primary-500/20">
              <BellRing className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-[13px] text-slate-900">Stay in the loop</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Get instant alerts for bookings, orders &amp; messages — even when Zenzy is closed.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:shadow-lg hover:shadow-primary-500/25 text-white text-[11px] font-extrabold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border-none"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={() => { setPushBannerVisible(false); sessionStorage.setItem("zenzy_push_dismissed", "1"); }}
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-bold px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border-none bg-transparent hover:bg-slate-50"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => { setPushBannerVisible(false); sessionStorage.setItem("zenzy_push_dismissed", "1"); }}
              className="text-slate-300 hover:text-slate-500 shrink-0 transition-all duration-200 cursor-pointer border-none bg-transparent p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Navbar ──────────────────────────────────────────────────── */}
      <header
        className={
          minimal
            ? "sticky top-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-slate-200/90 shadow-subtle"
            : `md:fixed absolute left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-full sm:max-w-[1380px] bg-white z-55 border border-slate-200/85 shadow-[0_12px_40px_rgba(37,99,235,0.13)] transition-all duration-300 ease-out ${mobileMenuOpen ? "rounded-[2rem]" : "rounded-full"
              } ${siteConfig?.showAnnouncement && siteConfig?.announcementBar ? "top-14" : "top-4"
              } ${showNavbar ? "translate-y-0 opacity-100 scale-100" : "translate-y-[-120%] opacity-0 scale-95 pointer-events-none"
              }`
        }
      >
        <div className={minimal ? "max-w-[1536px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between" : "px-6 sm:px-8 h-16 flex items-center justify-between"}>

          {/* Brand & Left Controls */}
          <div className="flex items-center gap-3">
            {minimal ? (
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-black text-[#0f2744] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                title="Go back to previous page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-500 hover:text-slate-900 transition-all duration-200 md:hidden text-xl focus:outline-none cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <Link href="/" className="relative flex items-center gap-2 text-2xl font-extrabold text-slate-900 tracking-tight">
              <img src="/logo.png" alt="Zenzy Logo" className="h-8 w-auto object-contain" />
              <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse-soft shadow-[0_0_6px_rgba(37,99,235,0.5)]" />
            </Link>
          </div>

          {/* Desktop Nav (Hidden in Minimal Mode) */}
          {!minimal && (
            <nav className="hidden md:flex items-center gap-1.5">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-extrabold tracking-wide border transition-all duration-150 ${isActive
                      ? "text-primary-650 bg-white border-primary-500/15 shadow-sm shadow-primary-500/5"
                      : "text-slate-650 border-transparent hover:text-primary-650 hover:bg-white hover:border-primary-500/15 shadow-xs hover:shadow-sm"
                      }`}
                  >
                    <i className={`fas ${link.icon} text-[14px]`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-slate-200/60 mx-1.5" />
              <Link
                href="/shop"
                className="special-badge-border rounded-full py-2 px-5 text-[13px] font-extrabold text-white transition-all duration-200 overflow-hidden flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <div className="special-badge-content flex items-center gap-1.5">
                  <i className="fas fa-store text-emerald-400" />
                  <span>Shop</span>
                </div>
              </Link>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 relative flex-nowrap shrink-0">

            {/* Bell button */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationsOpen((prev) => !prev);
                }}
                className="p-2.5 rounded-full text-slate-500 hover:text-primary-600 hover:bg-slate-50 transition-colors duration-150 relative cursor-pointer focus:outline-none border-none bg-transparent"
                title="Notifications"
              >
                <BellRing className="w-5 h-5" strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-gradient-to-r from-rose-500 to-rose-600 border-2 border-white rounded-full flex items-center justify-center animate-pulse" />
                )}
              </button>

              {/* ── Notification Panel Container ── */}
              {notificationsOpen && (
                mounted && typeof window !== "undefined" && window.innerWidth < 768 ? (
                  createPortal(
                    <div className="fixed inset-0 z-[999999] flex flex-col justify-end sm:justify-center p-3 sm:p-6 animate-fade-in">
                      {/* Mobile Backdrop Overlay */}
                      <div
                        onClick={() => setNotificationsOpen(false)}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                      />

                      {/* Mobile Modal Card */}
                      <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-[1000000] animate-slide-up">
                        {/* Mobile Touch Drag Indicator Bar */}
                        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

                        {/* Panel Header */}
                        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                              <BellRing className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Notifications</h4>
                              {unreadCount > 0 && (
                                <span className="text-[10px] text-rose-600 font-extrabold block">
                                  {unreadCount} unread alerts
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg transition border-none cursor-pointer"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => setNotificationsOpen(false)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition border-none bg-transparent cursor-pointer"
                              title="Close"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
                                <BellRing className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                              </div>
                              <p className="font-extrabold text-sm text-slate-800">All caught up!</p>
                              <p className="text-xs text-slate-400 mt-1 max-w-xs font-semibold">No active project alerts or notifications right now.</p>
                            </div>
                          ) : (
                            notifications.map((item) => {
                              const cfg = getNotifConfig(item.type);
                              const Icon = cfg.icon;
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    handleMarkAsRead(item.id);
                                    setNotificationsOpen(false);
                                    if (item.linkUrl) {
                                      router.push(item.linkUrl);
                                    } else if (item.projectId) {
                                      router.push(`/workspace/${item.projectId}`);
                                    } else {
                                      router.push("/notifications");
                                    }
                                  }}
                                  className={`w-full text-left flex items-start gap-3.5 px-4 py-4 transition-all duration-200 hover:bg-slate-50 active:bg-slate-100 group relative cursor-pointer border-none ${
                                    !item.read ? "bg-blue-50/40" : "bg-transparent"
                                  }`}
                                >
                                  {/* Unread Indicator Dot */}
                                  {!item.read && (
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-xs" />
                                  )}

                                  {/* Icon Badge */}
                                  <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs border border-slate-100`}>
                                    <Icon className={`w-5 h-5 ${item.read ? "text-slate-400" : "text-primary-600"}`} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                      <p className={`font-extrabold text-xs sm:text-sm leading-tight truncate ${item.read ? "text-slate-700" : "text-slate-900"}`}>
                                        {item.title}
                                      </p>
                                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                        {timeAgo(item.createdAt)}
                                      </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed mt-1 font-medium ${item.read ? "text-slate-400" : "text-slate-600"}`}>
                                      {item.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>{notifications.length} Total Alerts</span>
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              router.push("/notifications");
                            }}
                            className="text-primary-600 hover:text-primary-700 hover:underline cursor-pointer border-none bg-transparent font-extrabold"
                          >
                            Open Notifications Page ↗
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )
                ) : (
                  /* Desktop Popover Dropdown */
                  <div className="absolute top-[calc(100%+12px)] right-0 w-[390px] max-h-[520px] bg-white rounded-2xl border border-slate-200 shadow-[0_30px_90px_rgba(15,23,42,0.28)] z-[9999] animate-dropdown overflow-hidden flex flex-col">
                    {/* Desktop Header */}
                    <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
                          <BellRing className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                            {unreadCount} new
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[10.5px] font-bold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2.5 py-1 rounded-lg transition border-none cursor-pointer bg-transparent"
                          >
                            Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAll}
                            className="text-[10.5px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition border-none cursor-pointer bg-transparent"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition border-none bg-transparent cursor-pointer ml-1"
                          title="Close"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop Notifications List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-3">
                            <BellRing className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                          </div>
                          <p className="font-extrabold text-xs text-slate-800">All caught up!</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs font-semibold">No active project alerts or notifications right now.</p>
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const cfg = getNotifConfig(item.type);
                          const Icon = cfg.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                handleMarkAsRead(item.id);
                                setNotificationsOpen(false);
                                if (item.linkUrl) {
                                  router.push(item.linkUrl);
                                } else if (item.projectId) {
                                  router.push(`/workspace/${item.projectId}`);
                                } else {
                                  router.push("/notifications");
                                }
                              }}
                              className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all duration-200 hover:bg-slate-50 group relative cursor-pointer border-none ${
                                !item.read ? "bg-blue-50/40" : "bg-transparent"
                              }`}
                            >
                              {!item.read && (
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                              <div className={`w-8.5 h-8.5 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105 shadow-xs border border-slate-100`}>
                                <Icon className={`w-4 h-4 ${item.read ? "text-slate-400" : "text-primary-600"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className={`font-extrabold text-[12px] leading-tight truncate ${item.read ? "text-slate-700" : "text-slate-900"}`}>
                                    {item.title}
                                  </p>
                                  <span className="text-[9.5px] text-slate-400 font-mono shrink-0">
                                    {timeAgo(item.createdAt)}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-relaxed mt-0.5 font-medium ${item.read ? "text-slate-400" : "text-slate-600"}`}>
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Desktop Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>{notifications.length} Total Alerts</span>
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          router.push("/notifications");
                        }}
                        className="text-primary-600 hover:text-primary-700 hover:underline cursor-pointer border-none bg-transparent font-extrabold"
                      >
                        Open Full Notifications Page ↗
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Profile / Login */}
            {user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-full border-2 border-transparent hover:border-primary-500/20 transition-all duration-200 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none shrink-0 shadow-sm hover:shadow-md hover:shadow-primary-500/10 group"
                  title="Profile Menu"
                >
                  <img
                    src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    alt="User Profile"
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-80 bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200/60 overflow-hidden z-[999] animate-dropdown">

                    {/* User header - Premium Section */}
                    <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-slate-50/80 to-white border-b border-slate-200/40">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white/80 shadow-lg shadow-primary-500/10">
                            <img
                              src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                              className="w-full h-full object-cover"
                              alt="User Profile"
                            />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[15px] text-slate-900 truncate leading-tight">
                            {userData?.name || user.displayName || "Zenzy User"}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                            {userData?.email || user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${role === "worker"
                                ? "bg-amber-50 text-amber-600 border border-amber-200/50"
                                : "bg-primary-50 text-primary-600 border border-primary-200/50"
                              }`}>
                              {role === "worker" ? (
                                <>
                                  <Award className="w-2.5 h-2.5" />
                                  Professional
                                </>
                              ) : (
                                "Client"
                              )}
                            </span>
                            {role === "worker" && (
                              <span className="text-[8px] text-slate-400 font-medium">• Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items - Clean & Minimal */}
                    <div className="px-2 py-2">
                      {/* Dashboard */}
                      <Link
                        href={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-150 text-[13px] font-medium group"
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-primary-50 transition-colors duration-150">
                          <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-primary-500 transition-colors duration-150" />
                        </div>
                        <span>Dashboard</span>
                      </Link>

                      {/* Help Desk */}
                      <button
                        onClick={() => { setProfileDropdownOpen(false); window.dispatchEvent(new CustomEvent("open-support-desk")); }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition-all duration-150 text-[13px] font-medium cursor-pointer text-left border-none bg-transparent group"
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors duration-150">
                          <HelpCircle className="w-4 h-4 text-slate-500 group-hover:text-indigo-500 transition-colors duration-150" />
                        </div>
                        <span>Help & Support</span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-slate-200/60 my-1.5 mx-3"></div>

                      {/* Logout */}
                      <button
                        onClick={() => { setProfileDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 transition-all duration-150 text-[13px] font-medium cursor-pointer text-left border-none bg-transparent group"
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-rose-50 transition-colors duration-150">
                          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors duration-150" />
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth?role=professional"
                  className="hidden lg:flex px-5 py-2.5 rounded-full border border-slate-200/35 text-slate-700 bg-white hover:border-primary-500/15 hover:text-primary-650 hover:bg-slate-50/40 transition-all duration-150 font-extrabold text-[12px] tracking-wide items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-primary-500/5 hover:shadow-primary-500/10"
                >
                  <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>Join as Professional</span>
                </Link>
                <Link
                  href="/auth"
                  className="px-6 py-2.5 rounded-full bg-white border border-slate-200/35 text-slate-800 hover:border-primary-500/15 hover:text-primary-650 hover:bg-slate-50/40 transition-all duration-150 font-extrabold text-[12px] tracking-wide flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-primary-500/5 hover:shadow-primary-500/10"
                >
                  <UserIcon className="w-4 h-4" strokeWidth={2} />
                  <span>Sign In</span>
                </Link>
              </>
            )}

            {/* Admin Portal */}
            {(role === "admin" || isAdmin) && (
              <Link
                href="/admin"
                className="w-10 h-10 rounded-full bg-white border border-slate-200/35 text-slate-700 hover:border-primary-500/15 hover:text-primary-650 hover:bg-slate-50/40 flex items-center justify-center transition-all duration-150 shadow-sm shadow-primary-500/5 hover:shadow-primary-500/10 group"
                title="Admin Portal"
              >
                <Shield className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform duration-200" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white w-full px-5 py-6 space-y-2 rounded-b-[2rem] shadow-xl">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-5 py-3 rounded-full border transition-all duration-150 ${isActive
                    ? "bg-white border-primary-500/15 text-primary-650 font-extrabold shadow-sm shadow-primary-500/5"
                    : "bg-transparent border-transparent text-slate-750 font-bold hover:border-primary-500/15 hover:text-primary-650 hover:bg-slate-50/40 hover:shadow-xs"
                    }`}
                >
                  <div className="flex items-center gap-3.5">
                    <i className={`fas ${link.icon} text-primary-500 w-5 text-center text-sm`} />
                    <span className="text-[15px]">{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new CustomEvent("open-support-desk")); }}
              className="w-full flex items-center justify-between px-5 py-3 rounded-full border border-transparent hover:border-primary-500/15 text-slate-700 hover:text-primary-650 font-bold hover:bg-slate-50/40 transition-all duration-150 text-left cursor-pointer bg-transparent"
            >
              <div className="flex items-center gap-3.5">
                <i className="fas fa-life-ring text-indigo-500 w-5 text-center text-sm" />
                <span className="text-[15px]">Help Desk</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            <div className="pt-3">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="special-badge-border rounded-full py-3 px-5 text-[14px] font-extrabold text-white transition-all duration-200 overflow-hidden flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <div className="special-badge-content flex items-center justify-center gap-1.5">
                  <i className="fas fa-store text-emerald-400" />
                  <span>Shop</span>
                </div>
              </Link>
            </div>
            {!user && (
              <div className="pt-2">
                <Link
                  href="/auth?role=professional"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full border border-slate-200/60 hover:border-primary-500/15 text-slate-750 hover:text-primary-650 bg-white hover:bg-slate-50/40 rounded-full py-3.5 text-[15px] font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm shadow-primary-500/5 hover:shadow-primary-500/10"
                >
                  <Briefcase className="w-4 h-4" strokeWidth={2} />
                  <span>Join as Professional</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      {!isProfileView && (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-slate-200/60 z-50 flex items-center justify-around md:hidden shadow-[0_-4px_30px_rgba(0,0,0,0.06)] px-2">
          {[
            { href: "/", icon: Home, label: "Home" },
            { href: "/services", icon: Briefcase, label: "Services" },
            { href: "/rent", icon: Building, label: "Rent" },
            { href: "/shop", icon: ShoppingBag, label: "Shop" },
            { href: getDashboardPath(), icon: LayoutDashboard, label: "Dashboard" },
          ].map(({ href, icon: Icon, label }) => {
            const isActive = label === "Shop"
              ? pathname === "/shop"
              : label === "Dashboard"
                ? pathname.includes("dashboard")
                : pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-2 transition-all duration-200 relative ${isActive ? "text-primary-600 font-extrabold" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-bold">{label}</span>
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* All Apps Launcher Modal */}
      <AllAppsModal isOpen={allAppsOpen} onClose={() => setAllAppsOpen(false)} />
    </>
  );
}