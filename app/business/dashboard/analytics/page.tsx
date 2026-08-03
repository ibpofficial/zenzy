"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProCustomer, Project, Quotation, Inquiry } from "@/lib/schema";
import {
  TrendingUp,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  Star,
  Sparkles,
  PieChart,
  Target,
  Award
} from "lucide-react";

export default function ProAnalyticsPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<ProCustomer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync Data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const qCust = query(collection(db, "pro_customers"), where("professionalId", "==", user.uid));
    const unsubCust = onSnapshot(qCust, (snap) => {
      const list: ProCustomer[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProCustomer));
      setCustomers(list);
    });

    const qProj = query(collection(db, "projects"), where("businessId", "==", user.uid));
    const unsubProj = onSnapshot(qProj, (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Project));
      setProjects(list);
    });

    const qQuote = query(collection(db, "quotations"), where("businessId", "==", user.uid));
    const unsubQuote = onSnapshot(qQuote, (snap) => {
      const list: Quotation[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Quotation));
      setQuotes(list);
    });

    const qInq = query(collection(db, "inquiries"), where("businessId", "==", user.uid));
    const unsubInq = onSnapshot(qInq, (snap) => {
      const list: Inquiry[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Inquiry));
      setInquiries(list);
      setLoading(false);
    });

    return () => {
      unsubCust();
      unsubProj();
      unsubQuote();
      unsubInq();
    };
  }, [user]);

  // Metric Computations
  const totalCustomersCount = customers.length;
  const repeatCustomersCount = customers.filter(
    (c) => c.isRepeat || (c.completedProjectsCount && c.completedProjectsCount >= 2)
  ).length;

  const repeatRate = totalCustomersCount > 0 ? Math.round((repeatCustomersCount / totalCustomersCount) * 100) : 0;

  const totalRevenueSum = projects.reduce((sum, p) => sum + (p.agreedPrice || p.estimatedCost || 0), 0);
  const avgProjectValue = projects.length > 0 ? Math.round(totalRevenueSum / projects.length) : 0;

  const totalQuotesCount = quotes.length;
  const acceptedQuotesCount = quotes.filter((q) => q.status === "accepted" || q.status === "Accepted").length;
  const quoteAcceptanceRate = totalQuotesCount > 0 ? Math.round((acceptedQuotesCount / totalQuotesCount) * 100) : 0;

  const totalInquiriesCount = inquiries.length;
  const leadConversionRate = totalInquiriesCount > 0 ? Math.round((projects.length / totalInquiriesCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Business Analytics & Insights</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Performance metrics accompanied by plain-language strategic growth insights
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Computing analytics insights...</div>
      ) : (
        <div className="space-y-6">
          {/* Key Insight Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Repeat Customer Rate */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Repeat Customer Rate</span>
                </div>
                <span className="text-2xl font-extrabold text-blue-700">{repeatRate}%</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-blue-100 text-xs text-slate-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 font-bold">{repeatRate}% of your customers are repeat clients</strong> ({repeatCustomersCount} out of {totalCustomersCount}). High repeat rates reflect strong client trust and consistency.
                </p>
              </div>
            </div>

            {/* 2. Average Project Value */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Average Project Value</span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-700">₹{avgProjectValue.toLocaleString()}</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs text-slate-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Your average contract size is <strong className="text-slate-900 font-bold">₹{avgProjectValue.toLocaleString()}</strong> across {projects.length} recorded projects. Focus on upselling premium materials to raise ticket sizes.
                </p>
              </div>
            </div>

            {/* 3. Quote Acceptance Rate */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50/50 p-5 rounded-2xl border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Quote Acceptance Rate</span>
                </div>
                <span className="text-2xl font-extrabold text-purple-700">{quoteAcceptanceRate}%</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-purple-100 text-xs text-slate-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>
                  You have a <strong className="text-slate-900 font-bold">{quoteAcceptanceRate}% win rate</strong> on submitted proposals ({acceptedQuotesCount} accepted out of {totalQuotesCount} quotes).
                </p>
              </div>
            </div>

            {/* 4. Lead Conversion Rate */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm">Lead-to-Project Conversion</span>
                </div>
                <span className="text-2xl font-extrabold text-amber-700">{leadConversionRate}%</span>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-amber-100 text-xs text-slate-700 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 font-bold">{leadConversionRate}% of customer inquiries</strong> convert into active or completed projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
