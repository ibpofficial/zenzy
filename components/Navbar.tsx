"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckCheck,
  Trash2,
  BellRing,
  Info,
  Package,
  AlertCircle
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Notification type config ─────────────────────────────────────────────────
const NOTIF_TYPES: Record<string, { icon: React.ElementType; accent: string; bg: string; label: string }> = {
  booking:      { icon: Calendar,      accent: "bg-emerald-500",  bg: "bg-emerald-50",  label: "Booking" },
  message:      { icon: MessageSquare, accent: "bg-primary-500",  bg: "bg-primary-50",  label: "Message" },
  support:      { icon: MessageSquare, accent: "bg-primary-500",  bg: "bg-primary-50",  label: "Support" },
  payment:      { icon: CreditCard,    accent: "bg-amber-400",    bg: "bg-amber-50",    label: "Payment" },
  subscription: { icon: CreditCard,    accent: "bg-amber-400",    bg: "bg-amber-50",    label: "Subscription" },
  order:        { icon: Package,       accent: "bg-teal-500",     bg: "bg-teal-50",     label: "Order" },
  system:       { icon: Info,          accent: "bg-slate-400",    bg: "bg-slate-100",   label: "System" },
  alert:        { icon: AlertCircle,   accent: "bg-rose-500",     bg: "bg-rose-50",     label: "Alert" },
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

export default function Navbar({ isProfileView = false }: { isProfileView?: boolean }) {
  const pathname = usePathname();
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
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotificationsOpen(false);
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

  // ── Notifications listener ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const items: any[] = [];
      snap.forEach((d) => { const data = d.data(); if (data.userId === user.uid) items.push({ id: d.id, ...data }); });
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items);
    });
    return () => unsub();
  }, [user]);

  // ── Push permission banner ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      const dismissed = sessionStorage.getItem("zenzy_push_dismissed");
      if (!dismissed) setPushBannerVisible(true);
    }
  }, [user]);

  // ── Notification actions ─────────────────────────────────────────────────────
  const handleMarkAsRead = async (id: string) => {
    try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch {}
  };
  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.filter((n) => !n.read).forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    try { await batch.commit(); } catch {}
  };
  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    try { for (const n of notifications) await deleteDoc(doc(db, "notifications", n.id)); } catch {}
    setNotifications([]);
  };

  // ── Push permission request ──────────────────────────────────────────────────
  const handleEnablePush = async () => {
    setPushBannerVisible(false);
    sessionStorage.setItem("zenzy_push_dismissed", "1");
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Register SW and subscribe (hook in pushNotifications utility)
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
        <div className="fixed top-0 left-0 w-full z-[60] bg-primary-600 text-white py-2 text-[11px] font-extrabold tracking-wide announcement-container">
          <div className="announcement-scroll whitespace-nowrap">{siteConfig.announcementBar}</div>
        </div>
      )}

      {/* ── Push Permission Banner ───────────────────────────────────────── */}
      {pushBannerVisible && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-md">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.10)] p-4 flex items-start gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <BellRing className="w-4.5 h-4.5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-[13px] text-slate-900">Stay in the loop</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Get instant alerts for bookings, orders &amp; messages — even when Zenzy is closed.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl transition cursor-pointer border-none"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={() => { setPushBannerVisible(false); sessionStorage.setItem("zenzy_push_dismissed", "1"); }}
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-bold px-3 py-2 rounded-xl transition cursor-pointer border-none bg-transparent"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => { setPushBannerVisible(false); sessionStorage.setItem("zenzy_push_dismissed", "1"); }}
              className="text-slate-300 hover:text-slate-500 shrink-0 transition cursor-pointer border-none bg-transparent p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Main Navbar ──────────────────────────────────────────────────── */}
      <header
        className={`md:fixed absolute left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl bg-white z-55 border border-slate-200/80 transition-all duration-200 ease-out shadow-[0_4px_24px_rgba(0,0,0,0.06)] ${
          mobileMenuOpen ? "rounded-3xl" : "rounded-2xl"
        } ${
          siteConfig?.showAnnouncement && siteConfig?.announcementBar ? "top-14" : "top-4"
        } ${
          showNavbar ? "translate-y-0 opacity-100 scale-100" : "translate-y-[-120%] opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="px-6 sm:px-8 h-16 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-900 transition md:hidden text-xl focus:outline-none cursor-pointer hover:scale-110 active:scale-95 duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-1.5 text-2xl font-extrabold text-slate-900 tracking-tight hover:scale-[1.02] active:scale-95 transition-all duration-200">
              <img src="/logo.png" alt="Zenzy Logo" className="h-8 w-auto object-contain" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600 mt-1.5 brand-pulse-dot" />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-extrabold tracking-wide border transition-all duration-200 ease-out hover:scale-[1.03] active:scale-95 ${
                    isActive
                      ? "bg-white text-primary-600 shadow-[0_4px_12px_rgba(37,99,235,0.08)] border-slate-200/60"
                      : "text-slate-500 hover:text-primary-600 bg-slate-50/40 border-slate-200/20 hover:bg-white hover:shadow-subtle hover:border-slate-200/50"
                  }`}
                >
                  <i className={`fas ${link.icon}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <Link
              href="/shop"
              className="special-badge-border rounded-xl py-2 px-5 text-[13px] font-extrabold text-white transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden flex items-center gap-1.5"
            >
              <div className="special-badge-content flex items-center gap-1.5">
                <i className="fas fa-store text-emerald-400" />
                <span>Shop</span>
              </div>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 relative flex-nowrap shrink-0">

            {/* Bell button */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:bg-white hover:text-primary-600 hover:border-slate-300 hover:shadow-subtle hover:scale-105 active:scale-90 transition-all duration-200 relative cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Notification Panel ───────────────────────────────────── */}
              {notificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-2xl border border-slate-200/80 shadow-[0_16px_48px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] z-[999] animate-dropdown overflow-hidden">
                  
                  {/* Panel header */}
                  <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-slate-400" />
                      <h4 className="font-bold text-[13px] text-slate-800 tracking-tight">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="bg-primary-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full leading-none">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer transition"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 bg-transparent border-none cursor-pointer transition"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="max-h-[340px] overflow-y-auto hide-scrollbar divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
                          <Bell className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="font-bold text-[13px] text-slate-600">All caught up</p>
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">No new notifications right now.</p>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const cfg = getNotifConfig(item.type);
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleMarkAsRead(item.id)}
                            className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-all duration-150 hover:bg-slate-50/80 group relative cursor-pointer border-none ${
                              !item.read ? "bg-primary-50/30" : "bg-white"
                            }`}
                          >
                            {/* Unread accent bar */}
                            {!item.read && (
                              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-500 rounded-r-full" />
                            )}

                            {/* Icon badge */}
                            <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform`}>
                              <Icon className={`w-4 h-4 ${item.read ? "text-slate-400" : ""}`} style={item.read ? {} : { color: cfg.accent.replace("bg-", "").includes("primary") ? "#3b82f6" : undefined }} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`font-bold text-[12.5px] leading-tight truncate ${item.read ? "text-slate-600" : "text-slate-900"}`}>
                                  {item.title}
                                </p>
                                <span className="text-[9.5px] text-slate-400 font-medium shrink-0 mt-0.5">
                                  {timeAgo(item.createdAt)}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed mt-0.5 font-medium ${item.read ? "text-slate-400" : "text-slate-500"}`}>
                                {item.text}
                              </p>
                            </div>

                            {/* Unread dot */}
                            {!item.read && (
                              <span className="w-2 h-2 bg-primary-500 rounded-full shrink-0 mt-1.5" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile / Login */}
            {user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-xl border border-slate-200/60 hover:border-primary-500/40 hover:scale-105 active:scale-90 transition-all duration-200 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none shrink-0"
                  title="Profile Menu"
                >
                  <img
                    src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover"
                    alt="User Profile"
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white rounded-2xl border border-slate-200/80 shadow-float p-4 z-[999] animate-dropdown">
                    {/* User header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                        <img
                          src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                          className="w-full h-full object-cover"
                          alt="User Profile"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-[13px] text-slate-900 truncate">
                          {userData?.name || user.displayName || "Zenzy User"}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate font-semibold">
                          {userData?.email || user.email}
                        </p>
                        <span className={`inline-block text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5 ${
                          role === "worker" ? "bg-amber-100 text-amber-800" : "bg-primary-100 text-primary-800"
                        }`}>
                          {role === "worker" ? "Professional Partner" : "Client"}
                        </span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-1">
                      <Link
                        href={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition duration-150 text-[12px] font-extrabold hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>My Dashboard</span>
                      </Link>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); window.dispatchEvent(new CustomEvent("open-support-desk")); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 transition duration-150 text-[12px] font-extrabold cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98] border-none bg-transparent"
                      >
                        <i className="fas fa-life-ring text-slate-400 w-4" />
                        <span>Help Desk</span>
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); logout(); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition duration-150 text-[12px] font-extrabold cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98] border-none bg-transparent"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
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
                  className="hidden lg:flex px-4 py-2.5 rounded-xl border border-primary-500/30 text-primary-600 bg-primary-500/5 hover:bg-primary-500/10 hover:scale-105 active:scale-95 transition-all duration-200 font-extrabold text-[12px] tracking-wide items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Join as Professional</span>
                </Link>
                <Link
                  href="/auth"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 text-white hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md font-extrabold text-[12px] tracking-wide flex items-center gap-2 cursor-pointer border border-slate-200/20 hover:shadow-lg whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </>
            )}

            {/* Admin Portal */}
            {(role === "admin" || isAdmin) && (
              <Link
                href="/admin"
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600/30 text-slate-200 hover:from-indigo-600 hover:to-violet-600 hover:border-indigo-400/40 hover:text-white hover:shadow-[0_0_16px_rgba(99,102,241,0.3)] flex items-center justify-center hover:scale-105 active:scale-90 transition-all duration-300"
                title="Admin Portal"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white w-full px-5 py-6 space-y-2 rounded-b-3xl shadow-xl">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition duration-150 active:scale-[0.98] ${
                    isActive ? "bg-primary-50 text-primary-600 font-extrabold" : "text-slate-600 font-bold hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <i className={`fas ${link.icon} text-primary-500 w-5 text-center text-sm`} />
                    <span className="text-[14px]">{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileMenuOpen(false); window.dispatchEvent(new CustomEvent("open-support-desk")); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition duration-150 active:scale-[0.98] text-left cursor-pointer border-none bg-transparent"
            >
              <div className="flex items-center gap-3.5">
                <i className="fas fa-life-ring text-primary-500 w-5 text-center text-sm" />
                <span className="text-[14px]">Help Desk</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            <div className="pt-3">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="special-badge-border rounded-xl py-2 px-5 text-[14px] font-extrabold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
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
                  className="w-full border border-primary-500/30 text-primary-600 bg-primary-500/5 hover:bg-primary-500/10 rounded-xl py-3 text-[14px] font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Join as Professional</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      {!isProfileView && (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-white border-t border-slate-200 z-50 flex items-center justify-around md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.04)] px-2">
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
                className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-1.5 transition ${
                  isActive ? "text-primary-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
