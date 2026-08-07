"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Users,
  Image as ImageIcon,
  Calendar,
  FolderArchive,
  UserCheck,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Truck,
  Briefcase,
  MessageSquare,
  FileText,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  LayoutDashboard,
  Grid,
  BellRing
} from "lucide-react";

interface ProDashboardLayoutProps {
  children: React.ReactNode;
}

export default function ProDashboardLayout({ children }: ProDashboardLayoutProps) {
  const pathname = usePathname();
  const { user, userData, role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isCustomer = role === "customer" || role === "user" || role === "client";

  if (user && isCustomer) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-32 pb-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-md">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Professional Suite Access Restricted</h1>
            <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
              This Management &amp; CRM suite is designed for registered contractors, interior designers, and service professionals. Customer accounts do not have access to professional business suites.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider shadow-md hover:bg-slate-800 transition"
            >
              My Customer Dashboard
            </Link>
            <Link
              href="/apps"
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-extrabold uppercase tracking-wider border border-slate-200 hover:bg-slate-200 transition"
            >
              Back to Apps
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const navItems = [
    { name: "📱 ALL APPS Page", href: "/apps", icon: Grid, badge: "ALL" },
    { name: "Notifications & Alerts", href: "/notifications", icon: BellRing, badge: "Alerts" },
    { name: "Customer CRM", href: "/business/dashboard/crm", icon: Users, badge: "CRM" },
    { name: "Portfolio Manager", href: "/business/dashboard/portfolio", icon: ImageIcon },
    { name: "Universal Calendar", href: "/business/dashboard/calendar", icon: Calendar },
    { name: "Document Vault", href: "/business/dashboard/vault", icon: FolderArchive },
    { name: "Team & Staff", href: "/business/dashboard/team", icon: UserCheck },
    { name: "Finance & Invoices", href: "/business/dashboard/finance", icon: DollarSign },
    { name: "Warranty Desk", href: "/business/dashboard/warranty", icon: ShieldCheck },
    { name: "Business Analytics", href: "/business/dashboard/analytics", icon: TrendingUp },
    { name: "Suppliers & Costs", href: "/business/dashboard/suppliers", icon: Truck },
    { name: "Active Projects", href: "/business/dashboard/projects", icon: Briefcase },
    { name: "Leads & Inquiries", href: "/business/dashboard/inquiries", icon: MessageSquare },
    { name: "Sent Quotes", href: "/business/dashboard/quotes", icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sleek Executive Top Header Bar (No giant Navbar - Full view) */}
      <header className="bg-white border-b border-slate-200/90 shadow-subtle sticky top-0 z-40">
        <div className="max-w-[1536px] w-full mx-auto px-3 sm:px-5 lg:px-6 h-14 flex items-center justify-between">
          
          {/* Left: Back Button + Zenzy Logo */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-black text-[#0f2744] bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition cursor-pointer"
              title="Go back to Dashboard"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Zenzy Logo" className="h-7 w-auto object-contain" />
            </Link>
          </div>

          {/* Right: Notifications + User Profile Image / Avatar */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/apps"
              className="px-3 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-[#0f2744] text-xs font-black uppercase tracking-wider border border-slate-200/80 transition flex items-center gap-1.5"
            >
              <Grid className="w-3.5 h-3.5 text-[#0f2744]" />
              <span>Apps</span>
            </Link>

            <Link
              href="/notifications"
              className="p-2 rounded-[6px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative border border-slate-200/60"
              title="Notifications"
            >
              <BellRing className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </Link>

            <Link
              href="/worker/dashboard?tab=profile"
              className="flex items-center gap-2 p-1 pr-3 rounded-[6px] bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-[4px] bg-[#0f2744] text-white overflow-hidden border border-slate-300 flex items-center justify-center font-black text-xs shrink-0">
                {userData?.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userData?.name?.charAt(0) || "P"}</span>
                )}
              </div>
              <span className="text-xs font-black text-slate-800 truncate max-w-[120px] hidden sm:inline">
                {userData?.name || "Professional"}
              </span>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Suite Container right under permanent header bar */}
      <div className="flex-1 max-w-[1536px] w-full mx-auto px-3 sm:px-5 lg:px-6 pt-5 pb-12 space-y-5">
        {/* Executive Header Banner */}
        <div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] rounded-[10px] p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[8px] bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white">
                  {userData?.name || "Professional"} Suite
                </h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-[4px] border border-emerald-400/30 tracking-wider">
                  Executive HQ
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Private management suite for projects, CRM, finance, document vault & warranties
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/apps"
              className="px-4 py-2.5 rounded-[6px] bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider shadow-subtle border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>All Apps</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden flex items-center gap-2 px-3.5 py-2.5 rounded-[6px] bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>Suite Menu</span>
            </button>
            <Link
              href={`/business/${userData?.slug || user?.uid}`}
              className="px-4 py-2.5 rounded-[6px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-subtle transition-all flex items-center gap-1.5"
            >
              <span>View Profile</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Sidebar + Main Flex Layout with precise left alignment and width management */}
        <div className="flex flex-col lg:flex-row gap-5 items-start w-full">
          {/* Navigation Sidebar (Frozen sticky in place on scroll) */}
          <aside
            className={`transition-all duration-300 ${
              sidebarCollapsed ? "w-full lg:w-16" : "w-full lg:w-64"
            } shrink-0 space-y-3 text-left lg:sticky lg:top-16 self-start lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto scrollbar-none ${
              mobileSidebarOpen ? "block" : "hidden lg:block"
            }`}
          >
            <div className="bg-white rounded-[8px] border border-slate-200 shadow-subtle overflow-hidden p-3 space-y-1">
              {/* Sidebar Header with Small Toggle Arrow */}
              <div className="px-2 pt-1 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                {!sidebarCollapsed && (
                  <div>
                    <span className="text-[9px] font-black text-[#0f2744] uppercase tracking-widest block">
                      Management Modules
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                      Private Suite
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-auto border border-slate-200/60"
                  title={sidebarCollapsed ? "Expand sidebar menu" : "Collapse sidebar menu"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="pt-2 flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/business/dashboard" && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`w-full flex items-center ${
                        sidebarCollapsed ? "justify-center px-1" : "justify-between px-3"
                      } py-2.5 rounded-[6px] text-xs font-bold transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-[#0f2744] text-white shadow-subtle border-l-4 border-l-emerald-400 font-extrabold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2.5"} min-w-0`}>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-emerald-400" : "text-slate-400"
                          }`}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-[4px] font-black uppercase shrink-0 ${
                            isActive
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-200/80"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Module Main Content Area */}
          <main
            className="flex-1 min-w-0 w-full bg-white rounded-[8px] border border-slate-200 shadow-subtle p-6 min-h-[650px]"
          >
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
