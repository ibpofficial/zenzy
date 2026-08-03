"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { generatePdfFromElement } from "@/lib/pdfExport";
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Building2,
  Ruler,
  Layers,
  Wrench,
  DollarSign,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Hash,
  Eye,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Check,
  Share2,
  ChevronLeft,
  Briefcase,
  Sliders,
  FileCheck,
  Award,
  BadgeCheck,
  Zap,
  BarChart3,
  SlidersHorizontal,
  LayoutDashboard
} from "lucide-react";

export default function RequirementsBriefGeneratorPage() {
  const router = useRouter();
  const { user, userData } = useAuth();

  // Form State
  const [title, setTitle] = useState("4BHK Villa Interior & Renovation Brief");
  const [projectRefCode, setProjectRefCode] = useState(`PRJ-${Date.now().toString().slice(-6)}`);
  const [clientName, setClientName] = useState(userData?.name || user?.displayName || "Valued Client");
  const [clientEmail, setClientEmail] = useState(userData?.email || user?.email || "");
  const [clientPhone, setClientPhone] = useState(userData?.phone || "");
  const [location, setLocation] = useState("Gurugram, Haryana");
  
  const [category, setCategory] = useState("Renovation & Fitouts");
  const [propertyType, setPropertyType] = useState("Independent Villa / House");
  const [builtUpArea, setBuiltUpArea] = useState("1800");
  const [materialTier, setMaterialTier] = useState("Premium Quality");
  const [budgetRange, setBudgetRange] = useState("₹10,00,000 - ₹25,00,000");
  const [timeline, setTimeline] = useState("2-3 Months");

  const [selectedTrades, setSelectedTrades] = useState<string[]>([
    "Electrical & Smart Lighting",
    "Plumbing & Sanitaryware",
    "Flooring & Vitrified Tiling",
    "Interior Wall Painting",
    "Woodwork & Modular Cabinets"
  ]);

  const [specialNotes, setSpecialNotes] = useState(
    "1. All materials must conform to ISO 9001 quality standards with valid manufacturer warranties.\n2. Work execution to follow milestone-linked stage payments upon site verification.\n3. Daily site progress photo logs and weekly safety compliance reports required."
  );

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const briefRef = useRef<HTMLDivElement>(null);

  const materialTiers = [
    { label: "Luxury Tier", desc: "Imported Italian Marble, Teakwood, Kohler/Grohe Fixtures" },
    { label: "Premium Quality", desc: "Vitrified Tiles, Greenply Plywood, Jaquar Fixtures" },
    { label: "Standard Grade", desc: "Quality Ceramic Tiles, Commercial Plywood, Cera Fixtures" },
    { label: "Economy Basic", desc: "Essential Utility Finish" }
  ];

  const tradeOptions = [
    "Electrical & Smart Lighting",
    "Plumbing & Sanitaryware",
    "Flooring & Vitrified Tiling",
    "Interior Wall Painting",
    "False Ceiling & POP Works",
    "Woodwork & Modular Cabinets",
    "HVAC & Air Conditioning",
    "Civil Masonry & Demolition"
  ];

  const toggleTrade = (trade: string) => {
    if (selectedTrades.includes(trade)) {
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  };

  const handleDownloadPdf = async () => {
    if (!briefRef.current) return;
    setGeneratingPdf(true);
    try {
      const safeTitle = (title || "Requirements_Brief").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `Zenzy_Project_Brief_${safeTitle}_${new Date().toISOString().split("T")[0]}.pdf`;
      await generatePdfFromElement(briefRef.current, fileName);
      alert("✓ Custom Requirements Brief PDF generated & downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF automatically. Opening print preview...");
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePublishBrief = async () => {
    if (!user) {
      alert("Please log in to save and publish your project brief.");
      return;
    }

    setPublishing(true);
    try {
      const fullRequirementText = `Project Reference: ${projectRefCode}\nClient: ${clientName}\nEmail: ${clientEmail}\nPhone: ${clientPhone}\nProperty Type: ${propertyType}\nBuilt-up Area: ${builtUpArea} sq ft\nMaterial Tier: ${materialTier}\nTrades Included: ${selectedTrades.join(", ")}\nBudget Range: ${budgetRange}\nTimeline: ${timeline}\nLocation: ${location}\n\nSpecial Scope Notes:\n${specialNotes}`;

      await addDoc(collection(db, "projects"), {
        clientId: user.uid,
        clientName,
        clientEmail,
        clientPhone,
        title,
        projectReference: projectRefCode,
        description: fullRequirementText,
        category,
        propertyType,
        builtUpArea: Number(builtUpArea) || 1200,
        materialTier,
        tradesScope: selectedTrades,
        status: "brief",
        budgetRange,
        timelineEstimate: timeline,
        location,
        createdAt: new Date().toISOString()
      });

      alert("✓ Project Requirements Brief published! Navigating to Dashboard...");
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to publish brief:", err);
      alert("Failed to publish brief. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-[#0f2744] selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 space-y-6">
        
        {/* Admin Navigation Breadcrumb */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
              Zenzy Brief Protocol v2.4
            </span>
          </div>
        </div>

        {/* Admin Executive Header Banner */}
        <div className="bg-gradient-to-r from-[#0f2744] via-[#1a365d] to-[#0f2744] text-white p-6 sm:p-8 rounded-[10px] border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Executive Specification Console
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-[4px] border border-amber-500/30">
                ISO 9001 Standard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Generate & Download Custom Requirements Brief PDF
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl leading-relaxed">
              Configure strict technical specifications, material tiers, trade scope parameters, and export an official verified PDF brief for contractor verification.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-[8px] border border-slate-700 font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Brief
            </button>
            <button
              type="button"
              disabled={generatingPdf}
              onClick={handleDownloadPdf}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-[8px] font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {generatingPdf ? "Generating PDF..." : "Download Brief PDF"}
            </button>
          </div>
        </div>

        {/* Quick Operational Metrics Strip (Admin Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Scope Trades</span>
              <span className="text-lg font-black text-slate-900">{selectedTrades.length} Included</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Material Tier</span>
              <span className="text-xs font-black text-slate-900 truncate block max-w-[130px]">{materialTier}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Built-Up Area</span>
              <span className="text-lg font-black text-slate-900">{builtUpArea} Sq. Ft.</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-[10px] border border-slate-200/90 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Target Timeline</span>
              <span className="text-xs font-black text-slate-900 truncate block max-w-[130px]">{timeline}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Admin Form Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Section 1: Identification & Client Profile */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0f2744]" />
                  1. Project Identification & Client Credentials
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section 01</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Project Reference Code</label>
                  <input
                    type="text"
                    value={projectRefCode}
                    onChange={(e) => setProjectRefCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Project Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Client Full Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Client Contact Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Client Phone Number</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Site / Project Location Address</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Property & Scope Specs */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0f2744]" />
                  2. Property Parameters & Built-Up Area Scope
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section 02</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Property Type</label>
                  <input
                    type="text"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Built-up Area (Sq. Ft.)</label>
                  <input
                    type="text"
                    value={builtUpArea}
                    onChange={(e) => setBuiltUpArea(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Material Quality Tier */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0f2744]" />
                  3. Material Grade & Quality Tier Selection
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section 03</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {materialTiers.map((tier) => {
                  const isSelected = materialTier === tier.label;
                  return (
                    <div
                      key={tier.label}
                      onClick={() => setMaterialTier(tier.label)}
                      className={`p-4 rounded-[10px] border-2 cursor-pointer transition flex items-start gap-3 ${
                        isSelected
                          ? "bg-slate-50 border-[#0f2744] shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-[#0f2744] border-[#0f2744] text-white" : "border-slate-300 bg-white"
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">{tier.label}</span>
                        <span className="text-[11px] text-slate-500 font-medium leading-relaxed block mt-0.5">{tier.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Included Work Trades Scope */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#0f2744]" />
                  4. Included Work Trades & Technical Scope
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section 04</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tradeOptions.map((trade) => {
                  const isChecked = selectedTrades.includes(trade);
                  return (
                    <button
                      key={trade}
                      type="button"
                      onClick={() => toggleTrade(trade)}
                      className={`p-3 rounded-[8px] border text-left text-xs font-bold transition flex items-center gap-3 cursor-pointer ${
                        isChecked
                          ? "bg-[#0f2744] text-white border-[#0f2744] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked ? <CheckSquare className="w-4 h-4 text-white shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="truncate">{trade}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Commercial Budget & Scope Notes */}
            <div className="bg-white border border-slate-200/90 p-6 rounded-[10px] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-xs text-[#0f2744] uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#0f2744]" />
                  5. Commercial Budget, Timeline & Special Quality Notes
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section 05</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Target Budget Range</label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Target Timeline</label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Special Instructions & Quality Standards</label>
                <textarea
                  rows={4}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-xs text-slate-900 font-medium outline-none focus:border-[#0f2744] focus:bg-white leading-relaxed resize-none transition-all"
                />
              </div>
            </div>

            {/* Admin Action Card Bottom */}
            <div className="bg-[#0f2744] text-white p-6 rounded-[10px] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">Publish Brief to Network</span>
                <h4 className="font-extrabold text-sm text-white">Publish Brief for Contractor Bids</h4>
                <p className="text-xs text-slate-300 font-medium">Broadcast specification document to verified contractors to receive binding quotes.</p>
              </div>

              <button
                type="button"
                disabled={publishing}
                onClick={handlePublishBrief}
                className="bg-white hover:bg-slate-100 text-slate-950 px-6 py-3 rounded-[8px] font-extrabold text-xs uppercase tracking-wider transition shadow-sm shrink-0 cursor-pointer flex items-center gap-2"
              >
                <span>Publish Brief & Get Quotes</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Column: High-Definition Inspection Canvas (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">

            <div className="bg-[#0f2744] text-white p-4 rounded-t-[10px] flex justify-between items-center border border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-white">Verified PDF Document Canvas</span>
              </div>

              <span className="text-[10px] font-bold text-slate-300 uppercase bg-slate-800 px-2.5 py-1 rounded-[4px] border border-slate-700">
                A4 Standard Format
              </span>
            </div>

            {/* DOCUMENT CAPTURE CONTAINER FOR html2canvas & jsPDF */}
            <div className="border border-slate-200 rounded-b-[10px] bg-white p-6 shadow-md text-slate-900 font-sans space-y-6" ref={briefRef}>
              
              {/* Document Header Branding */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-indigo-800 tracking-widest bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-[4px] inline-block">
                    Verified Requirement Brief
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-2 leading-snug">{title}</h2>
                  <span className="text-[11px] text-slate-500 font-semibold block mt-1">
                    Ref Code: {projectRefCode} · Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black tracking-tight text-[#0f2744]">ZENZY</span>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Verified Platform</span>
                </div>
              </div>

              {/* Client & Site Info Table */}
              <div className="bg-slate-50 p-4 rounded-[8px] border border-slate-200/80 grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Client Profile</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{clientName}</strong>
                  <span className="text-[10px] text-slate-500 block truncate">{clientEmail}</span>
                  {clientPhone && <span className="text-[10px] text-slate-500 block">{clientPhone}</span>}
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Property & Location</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{propertyType}</strong>
                  <span className="text-[10px] text-slate-500 block">{builtUpArea} Sq. Ft. · {location}</span>
                </div>
              </div>

              {/* Specifications & Commercial Terms */}
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                <div className="bg-slate-50 p-3.5 rounded-[8px] border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Material Quality Tier</span>
                  <strong className="text-[#0f2744] text-xs font-black block mt-0.5">{materialTier}</strong>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-[8px] border border-slate-200">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Target Budget Range</span>
                  <strong className="text-emerald-700 text-xs font-black block mt-0.5">{budgetRange}</strong>
                </div>
              </div>

              {/* Included Trades Badges */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Scope of Included Work Trades</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTrades.map((trade, idx) => (
                    <span key={idx} className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-bold px-2.5 py-1 rounded-[4px]">
                      ✓ {trade}
                    </span>
                  ))}
                </div>
              </div>

              {/* Special Scope Notes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Special Scope Notes & Instructions</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-[8px] border border-slate-200/80 whitespace-pre-line">
                  {specialNotes}
                </p>
              </div>

              {/* Verification Footer Seal */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Zenzy Verified Specification Document
                </span>
                <span>Page 1 of 1</span>
              </div>

            </div>

            {/* Quick Action Button under Preview */}
            <button
              type="button"
              disabled={generatingPdf}
              onClick={handleDownloadPdf}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-[8px] font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {generatingPdf ? "Generating PDF Document..." : "Generate & Download Brief PDF"}
            </button>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
