"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, where, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  FileText, 
  MapPin, 
  DollarSign, 
  Clock, 
  Compass, 
  Users, 
  ShieldCheck, 
  Star, 
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Sliders,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("Renovate a Space");
  const [budgetRange, setBudgetRange] = useState("₹1,00,000 - ₹5,00,000");
  const [timeline, setTimeline] = useState("1-3 Months");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [requestedQuotes, setRequestedQuotes] = useState<{ [key: string]: boolean }>({});

  const categories = [
    { label: "Build a Home", dbCat: "Architect" },
    { label: "Renovate a Space", dbCat: "Contractor" },
    { label: "Design an Interior", dbCat: "Interior Design" },
    { label: "Plan an Event", dbCat: "Consulting" },
    { label: "Build an Office", dbCat: "Contractor" },
    { label: "Create a Commercial Project", dbCat: "Architect" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/auth?redirect=/projects/create");
      return;
    }

    setLoading(true);
    try {
      const selectedDbCat = categories.find(c => c.label === category)?.dbCat || "Contractor";
      
      const projectData = {
        clientId: user.uid,
        clientName: user.displayName || user.email?.split("@")[0] || "Client",
        businessId: "", // unassigned initially
        businessName: "",
        title,
        description: desc,
        category: selectedDbCat,
        status: "brief",
        budgetRange,
        timelineEstimate: timeline,
        location,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);
      setProjectId(docRef.id);
      
      // Fetch recommendations based on category
      setLoadingRecs(true);
      const q = query(
        collection(db, "workers"),
        where("category", "==", selectedDbCat),
        limit(4)
      );
      const snapshot = await getDocs(q);
      const recsList: any[] = [];
      snapshot.forEach(docSnap => {
        recsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRecommendations(recsList);
      setLoadingRecs(false);

    } catch (err) {
      console.error("Error creating project brief:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestQuote = async (businessId: string, businessName: string) => {
    if (!projectId || !user) return;
    
    try {
      // Create sub-quotation request document in quotes
      const quoteData = {
        projectId,
        businessId,
        businessName,
        items: [],
        materialsCost: 0,
        laborCost: 0,
        terms: "Please provide a details quote based on the project description.",
        status: "draft",
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "quotations"), quoteData);
      
      // Notify professional
      await addDoc(collection(db, "notifications"), {
        userId: businessId,
        title: "Project Quote Invite",
        message: `You have been invited to quote for project: "${title}"`,
        read: false,
        createdAt: new Date().toISOString()
      });

      setRequestedQuotes(prev => ({ ...prev, [businessId]: true }));
    } catch (err) {
      console.error("Failed to request quote:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-5 pt-28 pb-24">
        
        {/* Progress header */}
        <div className="text-center space-y-2 mb-10">
          <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full">
            Project Workspace Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {!projectId ? "Create a Project Brief" : "Recommended Service Professionals"}
          </h1>
          <p className="text-xs text-slate-400 font-semibold max-w-md mx-auto">
            {!projectId 
              ? "State your requirements, timeline, and budget. Zenzy will match you with verified professionals." 
              : "We found matching professionals for your project. Invite them to send quotation proposals."}
          </p>
        </div>

        {!projectId ? (
          /* QUESTIONNAIRE FORM */
          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500 rounded-full blur-[90px] opacity-10 pointer-events-none"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 text-xs font-bold">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Project Name / Scope</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Gurugram Duplex Interior Paint & Flooring"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                  />
                </div>

                {/* Outcome Category */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Project Outcome Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-205 focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat.label}>{cat.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Requirements Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Describe Project Scope & Details</label>
                <textarea
                  rows={4}
                  required
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Detail the materials preferred, dimensions, current site status, and standard specifications you need met..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-205 focus:border-indigo-500 resize-none font-medium text-[13px] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Budget */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Budget Range</label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-205 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="₹25,000 - ₹1,00,000">₹25,000 - ₹1,00,000</option>
                    <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                    <option value="₹5,00,000 - ₹20,00,000">₹5,00,000 - ₹20,00,000</option>
                    <option value="₹20,00,000+">₹20,00,000+</option>
                  </select>
                </div>

                {/* Timeline */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Expected Duration</label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-205 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="1-2 Weeks">1-2 Weeks</option>
                    <option value="2-4 Weeks">2-4 Weeks</option>
                    <option value="1-3 Months">1-3 Months</option>
                    <option value="3-6 Months">3-6 Months</option>
                  </select>
                </div>

                {/* Address Site */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Project Site Address</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. DLF Phase 3, Gurugram"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                  />
                </div>

              </div>

              {/* Submit CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg transition active:scale-[0.99] duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? "Registering Project..." : "Create Project Brief"} <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* RECOMMENDATIONS VIEW */
          <div className="space-y-8 animate-fade-up">
            
            {loadingRecs ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-semibold text-slate-500">Searching matching professionals...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                <Compass className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-extrabold text-white text-md">No Exact Category Matches</h3>
                <p className="text-slate-400 text-xs font-semibold max-w-sm mx-auto leading-relaxed">
                  We don't have matching professionals online in your locality currently. Go to the dashboard to monitor updates.
                </p>
                <Link href="/dashboard" className="inline-block bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs">
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((pro) => {
                  const hasRequested = !!requestedQuotes[pro.id];
                  return (
                    <div key={pro.id} className="bg-slate-900 border border-slate-800/80 p-5 rounded-[2rem] flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-slate-700 transition duration-300">
                      
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-850 shrink-0 border border-slate-800 shadow-md">
                          <img src={pro.avatar} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-[15px] text-white">{pro.companyName || pro.name}</span>
                            {pro.verified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-450 fill-emerald-500/10" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-450 font-bold block mt-0.5">{pro.category}</span>
                          <div className="flex items-center gap-1 text-gold text-[11px] font-black mt-2">
                            <Star className="w-3.5 h-3.5 fill-gold text-gold" /> {pro.stars || 5.0} 
                            <span className="text-slate-500 font-semibold">({pro.reviewsCount || 0} reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <Link
                          href={`/${pro.slug || pro.id}`}
                          className="flex-1 text-center bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-200 py-3 rounded-xl text-[10.5px] font-bold transition cursor-pointer"
                        >
                          View Business Web
                        </Link>
                        
                        <button
                          disabled={hasRequested}
                          onClick={() => handleRequestQuote(pro.id, pro.companyName || pro.name)}
                          className={`flex-grow py-3 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition duration-150 cursor-pointer ${
                            hasRequested
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                              : "bg-white hover:bg-slate-100 text-slate-950"
                          }`}
                        >
                          {hasRequested ? "✓ Invitation Sent" : "Request Quotation"}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-900">
              <span className="text-slate-550 text-xs font-semibold">Ready to monitor timeline milestone handovers?</span>
              <Link href="/dashboard" className="text-indigo-400 hover:underline font-bold text-xs flex items-center gap-1">
                Go to Client Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
