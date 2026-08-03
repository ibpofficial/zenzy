"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Building,
  Layers,
  ShieldCheck,
  Zap,
  Bookmark,
  Users,
  CheckCircle,
  Award,
  Star,
  CheckCheck,
  ArrowRight,
  Sparkles,
  ChevronLeft
} from "lucide-react";

export default function PlatformValuePage() {
  const valueProps = [
    {
      title: "Business Profiles",
      desc: "Comprehensive verified profile pages showcasing experience, licenses, and client ratings.",
      icon: <Building className="w-6 h-6" />,
      color: "cat-icon-blue",
      badge: "Verified Identity"
    },
    {
      title: "Project Workspaces",
      desc: "Dedicated shared digital space for every client project from first inquiry to final handover.",
      icon: <Layers className="w-6 h-6" />,
      color: "cat-icon-indigo",
      badge: "Core OS Module"
    },
    {
      title: "Complete Transparency",
      desc: "Real-time visibility into project timelines, cost breakdowns, and progress status for both parties.",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "cat-icon-emerald",
      badge: "Client Trust"
    },
    {
      title: "Smart Quotations",
      desc: "Generate and receive structured, line-itemized bids detailing labor, materials, and payment terms.",
      icon: <Zap className="w-6 h-6" />,
      color: "cat-icon-amber",
      badge: "Bidding Engine"
    },
    {
      title: "Secure Documentation",
      desc: "Centralized storage for architectural blueprints, contracts, permits, invoices, and receipts.",
      icon: <Bookmark className="w-6 h-6" />,
      color: "cat-icon-violet",
      badge: "Vault & Files"
    },
    {
      title: "Team Collaboration",
      desc: "Unify contractors, architects, team members, and clients inside role-governed communication channels.",
      icon: <Users className="w-6 h-6" />,
      color: "cat-icon-teal",
      badge: "Role Access"
    },
    {
      title: "Milestone Tracking",
      desc: "Break projects into clear execution stages with mandatory client review and digital sign-off.",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "cat-icon-orange",
      badge: "Stage Sign-offs"
    },
    {
      title: "Payments & Billing",
      desc: "Escrow milestone funding, instant digital invoicing, and direct transparent payment settlement.",
      icon: <Award className="w-6 h-6" />,
      color: "cat-icon-rose",
      badge: "Escrow Settlement"
    },
    {
      title: "Professional Portfolio",
      desc: "Showcase completed high-resolution job photos, verified case studies, and customer testimonials.",
      icon: <Star className="w-6 h-6" />,
      color: "cat-icon-cyan",
      badge: "Proof of Work"
    },
    {
      title: "Business Verification",
      desc: "Thorough manual trade license, identity, and background audits ensuring total client confidence.",
      icon: <CheckCheck className="w-6 h-6" />,
      color: "cat-icon-slate",
      badge: "Audit Standard"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-850 font-sans transition-colors relative overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-28 pb-16 flex-grow space-y-12">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-wider bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4 animate-fade-up">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-primary-600 bg-primary-50 uppercase tracking-wider border border-primary-100">
            <Sparkles className="w-4 h-4" /> Operating System Features
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Zenzy Platform Values & Capabilities
          </h1>
          <p className="text-slate-500 font-semibold text-lg leading-relaxed">
            Discover the 10 core pillars powering India's leading Operating System for construction companies, contractors, architects, interior designers, and service businesses.
          </p>
        </section>

        {/* 10 Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
          {valueProps.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Pillar #{idx + 1}</span>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-600 hover:text-primary-700 transition-colors group-hover:translate-x-1 duration-200"
                >
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-8 sm:p-12 text-white shadow-2xl animate-fade-up">
          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Ready to modernize your service business?
            </h2>
            <p className="text-slate-300 font-medium text-base">
              Set up your verified business profile, create project workspaces, and send professional quotations in minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                href="/services"
                className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-primary-600/30"
              >
                Get Started Now
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider transition-all backdrop-blur-sm"
              >
                Talk to Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
