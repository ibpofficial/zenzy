"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  ShieldAlert,
  Sun,
  Moon,
  Home,
  Briefcase,
  Building,
  LayoutDashboard,
  MessageSquare,
  Calendar,
  CreditCard,
  Check
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, role, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Real-time Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove("dark");
      localStorage.setItem("zenzy_dark_mode", "false");
      setIsDarkMode(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("zenzy_dark_mode", "true");
      setIsDarkMode(true);
    }
  };

  // Initialize Dark Mode based on preference
  useEffect(() => {
    const savedMode = localStorage.getItem("zenzy_dark_mode");
    const root = document.documentElement;
    if (savedMode === "true") {
      root.classList.add("dark");
      setIsDarkMode(true);
    } else {
      root.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  // Notifications Listener (Real-Time)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const items: any[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.userId === user.uid) {
          items.push({ id: docSnap.id, ...data });
        }
      });
      // Sort client-side desc by createdAt to avoid indexing limitations
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setNotifications(items);
    });

    return () => unsub();
  }, [user]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Failed to mark read: ", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach((n) => {
        batch.update(doc(db, "notifications", n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all read: ", err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    try {
      // Delete all notifications for the user
      for (const n of notifications) {
        await deleteDoc(doc(db, "notifications", n.id));
      }
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications: ", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const links = [
    { name: "Home", href: "/", icon: "fa-home" },
    { name: "Services", href: "/services", icon: "fa-th-large" },
    { name: "Rent Properties", href: "/rent", icon: "fa-house-chimney" },
    { name: "About", href: "/about", icon: "fa-info-circle" },
    { name: "Contact", href: "/contact", icon: "fa-envelope" }
  ];

  // Helper to determine dashboard path based on role
  const getDashboardPath = () => {
    if (role === "worker") return "/worker/dashboard";
    return "/dashboard";
  };

  return (
    <>
      {/* Announcement Bar - Fixed at top-0 */}
      {siteConfig?.showAnnouncement && siteConfig?.announcementBar && (
        <div className="fixed top-0 left-0 w-full z-[60] bg-primary-600 text-white py-2 text-[11px] font-extrabold tracking-wide announcement-container">
          <div className="announcement-scroll whitespace-nowrap">
            {siteConfig.announcementBar}
          </div>
        </div>
      )}

      {/* Floating Rectangle Navbar */}
      <header className={`fixed left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl glass-nav z-55 border border-slate-200/50 dark:border-slate-800/40 transition-all duration-300 ease-in-out shadow-[0_15px_35px_rgba(0,0,0,0.05),0_5px_15px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${
        mobileMenuOpen ? "rounded-3xl" : "rounded-2xl"
      } ${
        siteConfig?.showAnnouncement && siteConfig?.announcementBar ? "top-14" : "top-4"
      } ${
        showNavbar
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-[-120%] opacity-0 scale-95 pointer-events-none"
      }`}>
        <div className="px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition md:hidden text-xl focus:outline-none cursor-pointer hover:scale-110 active:scale-95 duration-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-1.5 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight hover:scale-105 active:scale-95 transition-transform duration-200">
              <span>{siteConfig?.siteName || "zenzy"}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-primary-600 dark:bg-primary-500 mt-1.5 brand-pulse-dot"></span>
            </Link>
          </div>

          {/* Desktop Navigation Link Pills */}
          <nav className="hidden md:flex gap-1 bg-slate-50/50 dark:bg-slate-950/40 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-subtle">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-extrabold tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-450 shadow-[0_8px_20px_rgba(37,99,235,0.12)] border border-slate-100/80 dark:border-slate-700/50"
                      : "text-slate-500 dark:text-slate-400 hover:text-primary-650 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] hover:border hover:border-slate-100/60 dark:hover:border-slate-800/80"
                  }`}
                >
                  <i className={`fas ${link.icon}`}></i>
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <Link
              href="/shop"
              className="special-badge-border rounded-xl py-2 px-5 text-[13px] font-extrabold text-white transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden flex items-center gap-1.5"
            >
              <div className="special-badge-content flex items-center gap-1.5">
                <i className="fas fa-store text-emerald-400"></i>
                <span>Shop</span>
              </div>
            </Link>
          </nav>

          {/* Actions Menu */}
          <div className="flex items-center gap-3 relative">
            {/* Dark Mode Toggle (Logged out only) */}
            {!user && (
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-subtle hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Notifications Trigger */}
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-855 hover:shadow-subtle hover:text-primary-600 dark:hover:text-primary-400 hover:scale-110 active:scale-90 transition-all duration-200 relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-red-500 border-2 border-white dark:border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-4 md:right-0 top-[70px] w-92 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-2xl p-4.5 z-[999] animate-dropdown max-w-[calc(100vw-32px)]">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-[14px] text-slate-900 dark:text-white">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-primary-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 hover:underline uppercase bg-transparent border-none cursor-pointer"
                        title="Mark all as read"
                      >
                        Read All
                      </button>
                    )}
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] font-extrabold text-red-500 hover:text-red-600 uppercase bg-transparent border-none cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto hide-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Bell className="w-8 h-8 mx-auto opacity-20 mb-2.5" />
                      <p className="text-xs font-bold">All caught up!</p>
                      <p className="text-[10px] mt-0.5">No new alerts to show.</p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      let Icon = Bell;
                      let iconColor = "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
                      if (item.type === "booking") {
                        Icon = Calendar;
                        iconColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
                      } else if (item.type === "message" || item.type === "support") {
                        Icon = MessageSquare;
                        iconColor = "bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400";
                      } else if (item.type === "payment" || item.type === "subscription") {
                        Icon = CreditCard;
                        iconColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
                      }
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleMarkAsRead(item.id)}
                          className={`p-3 rounded-2xl transition-all cursor-pointer text-left relative flex gap-3 group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 hover:translate-x-0.5 ${
                            item.read
                              ? "bg-slate-50/50 dark:bg-slate-850/20 opacity-80"
                              : "bg-gradient-to-r from-primary-50/40 to-indigo-50/10 dark:from-primary-950/10 dark:to-indigo-950/5 border-l-2 border-l-primary-500"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor} shadow-sm group-hover:scale-105 transition-transform`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="font-extrabold text-[12.5px] text-slate-850 dark:text-white truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-455 leading-relaxed mt-0.5 break-words font-medium">{item.text}</p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-550 block mt-1.5 font-semibold">
                              {new Date(item.createdAt).toLocaleDateString()} at{" "}
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          {!item.read && (
                            <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Account Profile / Login Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-400 hover:scale-110 active:scale-90 transition-all duration-200 flex items-center justify-center overflow-hidden cursor-pointer focus:outline-none"
                  title="Profile Menu"
                >
                  <img
                    src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                    className="w-full h-full object-cover"
                    alt="User Profile"
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 top-[70px] w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-float p-4 z-[999] animate-dropdown">
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border dark:border-slate-850">
                        <img
                          src={userData?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                          className="w-full h-full object-cover"
                          alt="User Profile"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-[13px] text-slate-900 dark:text-white truncate">
                          {userData?.name || user.displayName || "Zenzy User"}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 truncate font-semibold">
                          {userData?.email || user.email}
                        </p>
                        <span className={`inline-block text-[8px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5 ${
                          role === "worker"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-955/40 dark:text-amber-400"
                            : "bg-primary-100 text-primary-800 dark:bg-primary-955/40 dark:text-primary-400"
                        }`}>
                          {role === "worker" ? "Vetted Partner" : "Client"}
                        </span>
                      </div>
                    </div>

                    {/* Menu links */}
                    <div className="space-y-1">
                      <Link
                        href={getDashboardPath()}
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150 text-[12px] font-extrabold hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-450" />
                        <span>My Dashboard</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          window.dispatchEvent(new CustomEvent("open-support-desk"));
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150 text-[12px] font-extrabold cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98] border-none"
                      >
                        <i className="fas fa-life-ring text-slate-450 w-4"></i>
                        <span>Help Desk</span>
                      </button>

                      {/* Dark Mode toggle switcher */}
                      <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150 text-[12px] font-extrabold cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-450" />}
                          <span>Dark Mode</span>
                        </div>
                        <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-205 flex items-center ${isDarkMode ? 'bg-primary-650' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 transform ${isDarkMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      {/* Sign out */}
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 transition duration-150 text-[12px] font-extrabold cursor-pointer text-left hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <LogOut className="w-4 h-4 text-red-550" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="px-5 py-2.5 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md font-extrabold text-[12px] tracking-wide flex items-center gap-2 cursor-pointer border border-transparent dark:border-slate-800 hover:shadow-lg"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Hidden Admin Access Trigger for admins */}
            {role === "admin" && (
              <Link
                href="/admin"
                className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-955/30 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-200"
                title="God Mode Portal"
              >
                <ShieldAlert className="w-4 h-4 animate-bounce" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Dropdown Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 animate-fade-up w-full px-5 py-6 space-y-4 rounded-b-3xl">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 font-extrabold text-[15px] shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <i className={`fas ${link.icon} text-primary-500 w-5`}></i>
                <span>{link.name}</span>
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent("open-support-desk"));
              }}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 font-extrabold text-[15px] shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition text-left cursor-pointer border-none"
            >
              <i className="fas fa-life-ring text-primary-500 w-5"></i>
              <span>Help Desk</span>
            </button>

            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-bold text-[15px] hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition shadow-md"
            >
              <i className="fas fa-store text-emerald-400"></i>
              <span>Shop</span>
            </Link>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex items-center justify-around md:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.04)] px-2">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-1.5 transition ${
            pathname === "/" ? "text-primary-600 dark:text-primary-400 font-extrabold" : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          href="/services"
          className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-1.5 transition ${
            pathname === "/services" ? "text-primary-600 dark:text-primary-400 font-extrabold" : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px]">Services</span>
        </Link>

        <Link
          href="/rent"
          className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-1.5 transition ${
            pathname === "/rent" ? "text-primary-600 dark:text-primary-400 font-extrabold" : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
          }`}
        >
          <Building className="w-5 h-5" />
          <span className="text-[10px]">Rent</span>
        </Link>

        <Link
          href={getDashboardPath()}
          className={`flex flex-col items-center gap-0.5 justify-center flex-1 py-1.5 transition ${
            pathname.startsWith("/dashboard") || pathname.includes("dashboard")
              ? "text-primary-600 dark:text-primary-400 font-extrabold"
              : "text-slate-400 dark:text-slate-500 hover:text-slate-700"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </Link>
      </div>
    </>
  );
}
