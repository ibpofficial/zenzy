"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Grid,
  Search,
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
  ShoppingBag,
  Home,
  Star,
  FileCheck,
  Calculator,
  BellRing,
  ArrowUpRight,
  Zap
} from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  category: "business" | "customer" | "general";
  href: string;
  badge: string;
  icon: any;
  bubbleClass: string;
  badgeClass: string;
  hoverBorder: string;
  titleHover: string;
}

const ALL_APPS: AppItem[] = [
  // Business Apps
  {
    id: "crm",
    name: "Customer CRM",
    category: "business",
    href: "/business/dashboard/crm",
    badge: "CRM",
    icon: Users,
    bubbleClass: "bg-blue-50/90 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200",
    badgeClass: "bg-blue-50/80 text-blue-700 border-blue-200/60",
    hoverBorder: "hover:border-blue-300 hover:shadow-blue-500/5",
    titleHover: "group-hover:text-blue-600"
  },
  {
    id: "crm-360",
    name: "Customer 360°",
    category: "business",
    href: "/business/dashboard/crm",
    badge: "360° View",
    icon: UserCheck,
    bubbleClass: "bg-indigo-50/90 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200",
    badgeClass: "bg-indigo-50/80 text-indigo-700 border-indigo-200/60",
    hoverBorder: "hover:border-indigo-300 hover:shadow-indigo-500/5",
    titleHover: "group-hover:text-indigo-600"
  },
  {
    id: "portfolio",
    name: "Portfolio Manager",
    category: "business",
    href: "/business/dashboard/portfolio",
    badge: "Showcase",
    icon: ImageIcon,
    bubbleClass: "bg-purple-50/90 text-purple-600 border-purple-100 group-hover:bg-purple-100 group-hover:border-purple-200",
    badgeClass: "bg-purple-50/80 text-purple-700 border-purple-200/60",
    hoverBorder: "hover:border-purple-300 hover:shadow-purple-500/5",
    titleHover: "group-hover:text-purple-600"
  },
  {
    id: "calendar",
    name: "Universal Calendar",
    category: "business",
    href: "/business/dashboard/calendar",
    badge: "Schedule",
    icon: Calendar,
    bubbleClass: "bg-sky-50/90 text-sky-600 border-sky-100 group-hover:bg-sky-100 group-hover:border-sky-200",
    badgeClass: "bg-sky-50/80 text-sky-700 border-sky-200/60",
    hoverBorder: "hover:border-sky-300 hover:shadow-sky-500/5",
    titleHover: "group-hover:text-sky-600"
  },
  {
    id: "vault",
    name: "Document Vault",
    category: "business",
    href: "/business/dashboard/vault",
    badge: "Storage",
    icon: FolderArchive,
    bubbleClass: "bg-amber-50/90 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    badgeClass: "bg-amber-50/80 text-amber-700 border-amber-200/60",
    hoverBorder: "hover:border-amber-300 hover:shadow-amber-500/5",
    titleHover: "group-hover:text-amber-600"
  },
  {
    id: "team",
    name: "Team & Roster",
    category: "business",
    href: "/business/dashboard/team",
    badge: "Staff",
    icon: UserCheck,
    bubbleClass: "bg-emerald-50/90 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    badgeClass: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60",
    hoverBorder: "hover:border-emerald-300 hover:shadow-emerald-500/5",
    titleHover: "group-hover:text-emerald-600"
  },
  {
    id: "finance",
    name: "Finance & Cash Flow",
    category: "business",
    href: "/business/dashboard/finance",
    badge: "Invoices",
    icon: DollarSign,
    bubbleClass: "bg-teal-50/90 text-teal-600 border-teal-100 group-hover:bg-teal-100 group-hover:border-teal-200",
    badgeClass: "bg-teal-50/80 text-teal-700 border-teal-200/60",
    hoverBorder: "hover:border-teal-300 hover:shadow-teal-500/5",
    titleHover: "group-hover:text-teal-600"
  },
  {
    id: "warranty",
    name: "Warranty Desk",
    category: "business",
    href: "/business/dashboard/warranty",
    badge: "Certificates",
    icon: ShieldCheck,
    bubbleClass: "bg-orange-50/90 text-orange-600 border-orange-100 group-hover:bg-orange-100 group-hover:border-orange-200",
    badgeClass: "bg-orange-50/80 text-orange-700 border-orange-200/60",
    hoverBorder: "hover:border-orange-300 hover:shadow-orange-500/5",
    titleHover: "group-hover:text-orange-600"
  },
  {
    id: "analytics",
    name: "Business Analytics",
    category: "business",
    href: "/business/dashboard/analytics",
    badge: "Insights",
    icon: TrendingUp,
    bubbleClass: "bg-violet-50/90 text-violet-600 border-violet-100 group-hover:bg-violet-100 group-hover:border-violet-200",
    badgeClass: "bg-violet-50/80 text-violet-700 border-violet-200/60",
    hoverBorder: "hover:border-violet-300 hover:shadow-violet-500/5",
    titleHover: "group-hover:text-violet-600"
  },
  {
    id: "suppliers",
    name: "Suppliers & Costs",
    category: "business",
    href: "/business/dashboard/suppliers",
    badge: "Materials",
    icon: Truck,
    bubbleClass: "bg-rose-50/90 text-rose-600 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    badgeClass: "bg-rose-50/80 text-rose-700 border-rose-200/60",
    hoverBorder: "hover:border-rose-300 hover:shadow-rose-500/5",
    titleHover: "group-hover:text-rose-600"
  },
  {
    id: "projects",
    name: "Active Projects",
    category: "business",
    href: "/business/dashboard/projects",
    badge: "Live Work",
    icon: Briefcase,
    bubbleClass: "bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-slate-200 group-hover:border-slate-300",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    hoverBorder: "hover:border-slate-400 hover:shadow-slate-500/5",
    titleHover: "group-hover:text-slate-900"
  },
  {
    id: "inquiries",
    name: "Leads & Inquiries",
    category: "business",
    href: "/business/dashboard/inquiries",
    badge: "Inbox",
    icon: MessageSquare,
    bubbleClass: "bg-blue-50/90 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200",
    badgeClass: "bg-blue-50/80 text-blue-700 border-blue-200/60",
    hoverBorder: "hover:border-blue-300 hover:shadow-blue-500/5",
    titleHover: "group-hover:text-blue-600"
  },
  {
    id: "quotes",
    name: "Sent Proposals",
    category: "business",
    href: "/business/dashboard/quotes",
    badge: "Sent Quotes",
    icon: FileText,
    bubbleClass: "bg-indigo-50/90 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200",
    badgeClass: "bg-indigo-50/80 text-indigo-700 border-indigo-200/60",
    hoverBorder: "hover:border-indigo-300 hover:shadow-indigo-500/5",
    titleHover: "group-hover:text-indigo-600"
  },
  {
    id: "quote-generator",
    name: "Quote Generator",
    category: "business",
    href: "/worker/quote-generator",
    badge: "PDF Engine",
    icon: Calculator,
    bubbleClass: "bg-purple-50/90 text-purple-600 border-purple-100 group-hover:bg-purple-100 group-hover:border-purple-200",
    badgeClass: "bg-purple-50/80 text-purple-700 border-purple-200/60",
    hoverBorder: "hover:border-purple-300 hover:shadow-purple-500/5",
    titleHover: "group-hover:text-purple-600"
  },

  // Customer & Marketplace Apps
  {
    id: "services",
    name: "Find Service Pros",
    category: "customer",
    href: "/services",
    badge: "Hire Experts",
    icon: Search,
    bubbleClass: "bg-blue-50/90 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200",
    badgeClass: "bg-blue-50/80 text-blue-700 border-blue-200/60",
    hoverBorder: "hover:border-blue-300 hover:shadow-blue-500/5",
    titleHover: "group-hover:text-blue-600"
  },
  {
    id: "estore",
    name: "Zenzy E-Store",
    category: "customer",
    href: "/shop",
    badge: "Shop Tools",
    icon: ShoppingBag,
    bubbleClass: "bg-emerald-50/90 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200",
    badgeClass: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60",
    hoverBorder: "hover:border-emerald-300 hover:shadow-emerald-500/5",
    titleHover: "group-hover:text-emerald-600"
  },
  {
    id: "rentals",
    name: "Rent Properties",
    category: "customer",
    href: "/rent",
    badge: "Properties",
    icon: Home,
    bubbleClass: "bg-indigo-50/90 text-indigo-600 border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200",
    badgeClass: "bg-indigo-50/80 text-indigo-700 border-indigo-200/60",
    hoverBorder: "hover:border-indigo-300 hover:shadow-indigo-500/5",
    titleHover: "group-hover:text-indigo-600"
  },
  {
    id: "brief-pdf",
    name: "PDF Brief Generator",
    category: "customer",
    href: "/requirements/brief-generator",
    badge: "Scope Brief",
    icon: FileCheck,
    bubbleClass: "bg-amber-50/90 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    badgeClass: "bg-amber-50/80 text-amber-700 border-amber-200/60",
    hoverBorder: "hover:border-amber-300 hover:shadow-amber-500/5",
    titleHover: "group-hover:text-amber-600"
  },
  {
    id: "favorites",
    name: "Saved Favorites",
    category: "customer",
    href: "/dashboard",
    badge: "Saved",
    icon: Star,
    bubbleClass: "bg-rose-50/90 text-rose-600 border-rose-100 group-hover:bg-rose-100 group-hover:border-rose-200",
    badgeClass: "bg-rose-50/80 text-rose-700 border-rose-200/60",
    hoverBorder: "hover:border-rose-300 hover:shadow-rose-500/5",
    titleHover: "group-hover:text-rose-600"
  },
  {
    id: "notifications",
    name: "Notifications Hub",
    category: "general",
    href: "/notifications",
    badge: "Alerts",
    icon: BellRing,
    bubbleClass: "bg-amber-50/90 text-amber-600 border-amber-100 group-hover:bg-amber-100 group-hover:border-amber-200",
    badgeClass: "bg-amber-50/80 text-amber-700 border-amber-200/60",
    hoverBorder: "hover:border-amber-300 hover:shadow-amber-500/5",
    titleHover: "group-hover:text-amber-600"
  }
];

export default function DedicatedAllAppsPage() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const isCustomerRole = role === "user" || (role as string) === "customer" || (role as string) === "client";
  const [activeCategory, setActiveCategory] = useState<"all" | "business" | "customer">("all");

  const PRO_ONLY_APP_IDS = ["crm", "crm-360", "portfolio", "team", "finance", "analytics", "suppliers"];

  const filteredApps = ALL_APPS.filter((app) => {
    // Hide contractor-only CRM tools if user is a customer
    if (isCustomerRole && PRO_ONLY_APP_IDS.includes(app.id)) {
      return false;
    }

    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.badge.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || app.category === activeCategory || app.category === "general";
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1536px] w-full mx-auto px-3 sm:px-5 lg:px-6 pt-24 sm:pt-28 pb-10 space-y-4">
        
        {/* Executive Header Bar */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 text-slate-900 shadow-subtle border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
              <Zap className="w-5.5 h-5.5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100">
                  <Zap className="w-3 h-3" /> App Launcher
                </span>
                <span className="text-xs font-extrabold text-slate-400">
                  • {filteredApps.length} Apps
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Zenzy App Directory
              </h1>
            </div>
          </div>

          {/* Controls: Category Filter + Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Category Tabs */}
            <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                All Apps
              </button>
              <button
                onClick={() => setActiveCategory("business")}
                className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer ${
                  activeCategory === "business"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                Project Suite
              </button>
              <button
                onClick={() => setActiveCategory("customer")}
                className={`px-3 py-1.5 rounded-lg font-extrabold text-[11px] transition cursor-pointer ${
                  activeCategory === "customer"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                Marketplace & Services
              </button>
            </div>

            {/* Compact Search Bar */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Quick find app..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* High-Density Distinct Subtle Pastel Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2.5 sm:gap-3">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link
                key={app.id}
                href={app.href}
                className={`relative z-10 bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between h-[132px] sm:h-[136px] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer group ${app.hoverBorder}`}
              >
                {/* Top Row: Larger Soft Icon Bubble + Tailored Pastel Pill Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border shadow-inner flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0 ${app.bubbleClass}`}
                  >
                    <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 transition-colors ${app.badgeClass}`}
                  >
                    {app.badge}
                  </span>
                </div>

                {/* Bottom Row: App Name & Subtle Arrow */}
                <div className="flex items-end justify-between gap-1 pt-2">
                  <span
                    className={`font-extrabold text-[12.5px] sm:text-[13.5px] text-slate-850 tracking-tight leading-tight transition-colors line-clamp-2 ${app.titleHover}`}
                  >
                    {app.name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mb-0.5" />
                </div>
              </Link>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}
