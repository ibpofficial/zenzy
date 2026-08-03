"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { findRecommendedProfessionals, MatchedProfessional, RequirementPayload } from "@/lib/requirementWizard";
import {
  Sparkles,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Paintbrush,
  Zap,
  Wrench,
  ShieldCheck,
  IndianRupee,
  Calendar,
  MapPin,
  Star,
  Users,
  Check,
  Send
} from "lucide-react";

const CATEGORIES = [
  { id: "construction", name: "Building & Construction", icon: Building2, desc: "Turnkey home & commercial construction" },
  { id: "interior", name: "Interior Design & Fitouts", icon: Paintbrush, desc: "Modular kitchens, false ceilings, full interiors" },
  { id: "electrical", name: "Electrical & Smart Automation", icon: Zap, desc: "Wiring, solar setups, smart home integration" },
  { id: "plumbing", name: "Plumbing & Sanitary", icon: Wrench, desc: "Piping, bath fixtures & leakage solutions" },
];

const PROJECT_TYPES = [
  { id: "residential", label: "Residential Home" },
  { id: "commercial", label: "Commercial Office / Shop" },
  { id: "renovation", label: "Renovation & Remodel" },
  { id: "repair", label: "Maintenance & Repair" },
];

const DELIVERABLES_LIST = [
  "Architectural Blueprints & 3D Renderings",
  "BOQ (Bill of Quantities) & Material List",
  "Milestone-linked Escrow Payment Guarantee",
  "On-site Supervision & Daily Media Updates",
  "12-Month Structural & Craftsmanship Warranty",
  "Government / Municipal Approval Assistance",
];

export default function RequirementWizardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Form State
  const [category, setCategory] = useState("construction");
  const [projectType, setProjectType] = useState<RequirementPayload["projectType"]>("residential");
  const [location, setLocation] = useState("Mumbai");
  const [budgetMin, setBudgetMin] = useState(500000);
  const [budgetMax, setBudgetMax] = useState(2500000);
  const [startDateOption, setStartDateOption] = useState<RequirementPayload["startDateOption"]>("within_2_weeks");
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([
    "Architectural Blueprints & 3D Renderings",
    "Milestone-linked Escrow Payment Guarantee",
    "12-Month Structural & Craftsmanship Warranty"
  ]);
  const [description, setDescription] = useState("");
  const [contactName, setContactName] = useState(user?.displayName || "");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");

  // Recommendations State
  const [matches, setMatches] = useState<MatchedProfessional[]>([]);
  const [shortlistedUids, setShortlistedUids] = useState<string[]>([]);

  const toggleDeliverable = (item: string) => {
    if (selectedDeliverables.includes(item)) {
      setSelectedDeliverables(selectedDeliverables.filter((d) => d !== item));
    } else {
      setSelectedDeliverables([...selectedDeliverables, item]);
    }
  };

  const handleFetchRecommendations = async () => {
    setLoadingMatches(true);
    setStep(4);

    const results = await findRecommendedProfessionals({
      category,
      projectType,
      location,
      budgetMin,
      budgetMax,
      startDateOption,
      deliverables: selectedDeliverables,
      description
    });

    setMatches(results);
    setLoadingMatches(false);
  };

  const toggleShortlist = (uid: string) => {
    if (shortlistedUids.includes(uid)) {
      setShortlistedUids(shortlistedUids.filter((id) => id !== uid));
    } else {
      setShortlistedUids([...shortlistedUids, uid]);
    }
  };

  const handleSendDirectInquiry = async (proUid: string, proName: string) => {
    try {
      setSubmittingInquiry(true);
      const now = new Date().toISOString();

      const inquiryData = {
        businessId: proUid,
        professionalId: proUid,
        clientId: user?.uid || "guest-client",
        clientName: contactName || user?.displayName || "Valued Client",
        clientEmail: contactEmail || user?.email || "",
        title: `${category.toUpperCase()} Project - ${location}`,
        requirements: `${description}\n\nProject Type: ${projectType}\nDeliverables Needed: ${selectedDeliverables.join(", ")}`,
        budgetRange: `₹${(budgetMin / 100000).toFixed(1)}L - ₹${(budgetMax / 100000).toFixed(1)}L`,
        timelineEstimate: startDateOption.replace(/_/g, " "),
        documents: [],
        stage: "received",
        stageHistory: [{ stage: "received", timestamp: now, note: "Inquiry submitted via Requirement Wizard", updatedBy: user?.uid || "guest" }],
        quotationIds: [],
        createdAt: now,
        updatedAt: now
      };

      await addDoc(collection(db, "inquiries"), inquiryData);
      alert(`Inquiry sent successfully to ${proName}! They will prepare an interactive quote shortly.`);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      alert("Error sending inquiry. Please try again.");
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 pt-28 pb-20 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700">
            <Sparkles className="w-3.5 h-3.5" /> Zenzy Requirement Wizard
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Scope Your Service Requirement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">
            Answer 3 quick steps to match with top-rated, verified service professionals and receive interactive, transparent quotes.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs grid grid-cols-4 gap-2 text-center text-xs font-bold">
          <div className={`p-2.5 rounded-xl transition ${step === 1 ? "bg-slate-900 text-white font-black shadow-xs" : "bg-slate-100 text-slate-600"}`}>
            1. Category & Scope
          </div>
          <div className={`p-2.5 rounded-xl transition ${step === 2 ? "bg-slate-900 text-white font-black shadow-xs" : "bg-slate-100 text-slate-600"}`}>
            2. Budget & Timeline
          </div>
          <div className={`p-2.5 rounded-xl transition ${step === 3 ? "bg-slate-900 text-white font-black shadow-xs" : "bg-slate-100 text-slate-600"}`}>
            3. Deliverables
          </div>
          <div className={`p-2.5 rounded-xl transition ${step === 4 ? "bg-slate-900 text-white font-black shadow-xs" : "bg-slate-100 text-slate-600"}`}>
            4. Verified Pros
          </div>
        </div>

        {/* STEP 1: CATEGORY & SCOPE */}
        {step === 1 && (
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Select Service Category</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">What primary work do you need performed?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-5 rounded-2xl border text-left transition flex items-start gap-4 cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{cat.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">Project Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROJECT_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setProjectType(pt.id as any)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      projectType === pt.id ? "bg-slate-900 text-white border-slate-900" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">City / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                Next: Budget & Timeline <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET & TIMELINE */}
        {step === 2 && (
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Budget Range & Timeline</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Help professionals tailor an accurate quote.</p>
            </div>

            <div className="space-y-4 bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Estimated Budget Range:</span>
                <span className="text-indigo-700 font-black text-sm">
                  ₹{(budgetMin / 100000).toFixed(1)} Lakhs – ₹{(budgetMax / 100000).toFixed(1)} Lakhs
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    step={50000}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    step={100000}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">When do you want to start?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "immediately", label: "Immediately (Within 3 days)" },
                  { id: "within_2_weeks", label: "Within 2 Weeks" },
                  { id: "within_month", label: "Within 1 Month" },
                  { id: "planning_phase", label: "Just Planning & Estimating" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStartDateOption(opt.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                      startDateOption === opt.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">Project Summary / Special Notes</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify dimensions, material preferences, room counts, or specific items..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer"
              >
                Next: Deliverables <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DELIVERABLES & CONTACT INFO */}
        {step === 3 && (
          <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-fade-in">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Required Deliverables & Guarantee Terms</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Select what must be included in your contract.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DELIVERABLES_LIST.map((item) => {
                const checked = selectedDeliverables.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleDeliverable(item)}
                    className={`p-3.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      checked ? "bg-indigo-50 border-indigo-400 text-indigo-950" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{item}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${checked ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"}`}>
                      {checked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Contact Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contact Details for Instant Quotes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                />
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Email Address"
                  className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-bold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleFetchRecommendations}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                Find Recommended Pros <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFIED MATCHED PROFESSIONALS & COMPARISON */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700">
                  Recommended Pros Found
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Top Recommended Service Professionals
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Filtered for {category} in {location} within your ₹{(budgetMin / 100000).toFixed(1)}L - ₹{(budgetMax / 100000).toFixed(1)}L budget.
                </p>
              </div>

              {shortlistedUids.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl text-xs font-bold text-indigo-900 flex items-center gap-2">
                  <span>{shortlistedUids.length} Professional(s) Shortlisted</span>
                  <Link href="/compare" className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[11px] font-black hover:bg-indigo-700">
                    Compare Side-by-Side
                  </Link>
                </div>
              )}
            </div>

            {loadingMatches ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Matching with Top Verified Pros...</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">No direct matches found in this category.</p>
                <p className="text-xs text-slate-500">You can adjust your search criteria or browse our full directory.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {matches.map((item) => {
                  const pro = item.profile;
                  const isShortlisted = shortlistedUids.includes(pro.uid);
                  return (
                    <div key={pro.uid} className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:border-indigo-300 transition space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={pro.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80"}
                            alt=""
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-slate-900">{pro.name || pro.companyName}</h3>
                              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> {item.matchScore}% Match
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{pro.category} · {pro.experience || "5+ Years Exp"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleShortlist(pro.uid)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              isShortlisted ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {isShortlisted ? "★ Shortlisted" : "+ Shortlist"}
                          </button>
                          <button
                            disabled={submittingInquiry}
                            onClick={() => handleSendDirectInquiry(pro.uid, pro.name || pro.companyName)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Request Interactive Quote
                          </button>
                        </div>
                      </div>

                      {/* Match Reasons Badges */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
                        {item.matchReasons.map((reason) => (
                          <span key={reason} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                            ✓ {reason}
                          </span>
                        ))}
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">
                          ⚡ {item.estimatedResponseTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
