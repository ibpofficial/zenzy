"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Grid,
  X,
  Search,
  Users,
  ImageIcon,
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
  Sparkles,
  Award,
  ChevronRight
} from "lucide-react";

interface AllAppsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "professional" | "customer" | "auto";
}

export default function AllAppsModal({ isOpen, onClose, mode = "auto" }: AllAppsModalProps) {
  const router = useRouter();
  const { role } = useAuth();
  const [search, setSearch] = useState("");

  const isProView = mode === "professional" || (mode === "auto" && role === "worker");
  const [activeTab, setActiveTab] = useState<"pro" | "customer">(isProView ? "pro" : "customer");

  if (!isOpen) return null;

  const proApps = [
    {
      name: "Customer CRM",
      desc: "Manage client leads, notes & follow-ups",
      href: "/business/dashboard/crm",
      icon: Users,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      name: "Customer 360",
      desc: "Aggregated timeline, invoices & project history",
      href: "/business/dashboard/crm",
      icon: UserCheck,
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    {
      name: "Portfolio Manager",
      desc: "Before/After photo pairs & project showcase",
      href: "/business/dashboard/portfolio",
      icon: ImageIcon,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      name: "Universal Calendar",
      desc: "Site visits, meetings & payment dues schedule",
      href: "/business/dashboard/calendar",
      icon: Calendar,
      color: "bg-sky-50 text-sky-600 border-sky-200"
    },
    {
      name: "Document Vault",
      desc: "GST, PAN, contracts, drawings & insurance",
      href: "/business/dashboard/vault",
      icon: FolderArchive,
      color: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      name: "Team & Staff",
      desc: "Staff roster, daily attendance & salary log",
      href: "/business/dashboard/team",
      icon: UserCheck,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      name: "Finance & Cash Flow",
      desc: "Revenue, expense logger & net profit reports",
      href: "/business/dashboard/finance",
      icon: DollarSign,
      color: "bg-teal-50 text-teal-600 border-teal-200"
    },
    {
      name: "Warranty Desk",
      desc: "Digital warranty certificates & claim logger",
      href: "/business/dashboard/warranty",
      icon: ShieldCheck,
      color: "bg-orange-50 text-orange-600 border-orange-200"
    },
    {
      name: "Business Analytics",
      desc: "Strategic growth insights & quote win rates",
      href: "/business/dashboard/analytics",
      icon: TrendingUp,
      color: "bg-violet-50 text-violet-600 border-violet-200"
    },
    {
      name: "Suppliers & Costs",
      desc: "Dealer directory & side-by-side cost matrix",
      href: "/business/dashboard/suppliers",
      icon: Truck,
      color: "bg-rose-50 text-rose-600 border-rose-200"
    },
    {
      name: "Active Projects",
      desc: "Stage tracking & milestone payouts",
      href: "/business/dashboard/projects",
      icon: Briefcase,
      color: "bg-slate-100 text-slate-800 border-slate-200"
    },
    {
      name: "Leads & Inquiries",
      desc: "Client project briefs & chat inquiries",
      href: "/business/dashboard/inquiries",
      icon: MessageSquare,
      color: "bg-[#0f172a] text-white border-slate-800"
    },
    {
      name: "Sent Proposals",
      desc: "Quotation documents & e-signatures",
      href: "/business/dashboard/quotes",
      icon: FileText,
      color: "bg-blue-600 text-white border-blue-500"
    }
  ];

  const customerApps = [
    {
      name: "Find Professionals",
      desc: "Browse top-rated contractors & architects",
      href: "/services",
      icon: Briefcase,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      name: "Zenzy E-Store",
      desc: "Building materials, tools & hardware",
      href: "/shop",
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200"
    },
    {
      name: "Rent Properties",
      desc: "Verified residential & commercial rentals",
      href: "/rent",
      icon: Home,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      name: "Requirements Brief",
      desc: "Custom project brief generator & cost estimate",
      href: "/requirements",
      icon: FileCheck,
      color: "bg-amber-50 text-amber-600 border-amber-200"
    },
    {
      name: "My Bookings & Tracker",
      desc: "Live milestone tracking & progress updates",
      href: "/dashboard",
      icon: Calendar,
      color: "bg-sky-50 text-sky-600 border-sky-200"
    },
    {
      name: "My Quotations",
      desc: "Review & accept proposals from contractors",
      href: "/dashboard",
      icon: FileText,
      color: "bg-teal-50 text-teal-600 border-teal-200"
    },
    {
      name: "Saved Favorites",
      desc: "Bookmarked contractors & materials",
      href: "/dashboard",
      icon: Star,
      color: "bg-rose-50 text-rose-600 border-rose-200"
    }
  ];

  const filteredProApps = proApps.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomerApps = customerApps.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Zenzy Apps & Suite</h2>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  All Apps
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Instant access to all professional business tools & customer services
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tab Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("pro")}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "pro"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Professional Suite Apps</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "customer"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Apps</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search apps by name or function..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Section 1: Professional Suite Modules */}
        {activeTab === "pro" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Professional Suite Apps
                </h3>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                Private Business HQ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => handleNavigate(app.href)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group flex items-start gap-3 cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${app.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors truncate">
                          {app.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{app.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: For Customers & General Users */}
        {activeTab === "customer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Customer & Client Apps
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Services & Booking
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredCustomerApps.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => handleNavigate(app.href)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group flex items-start gap-3 cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${app.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-600 transition-colors truncate">
                          {app.name}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{app.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
