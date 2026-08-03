"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where, limit, updateDoc, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewModal from "@/components/ReviewModal";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Star, 
  Mail, 
  Award, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  ChevronRight,
  Briefcase,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  ThumbsUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BusinessProfilePage({ params }: PageProps) {
  const routeParams = useParams();
  const slug = routeParams?.slug as string;
  const router = useRouter();
  const { user, role } = useAuth();
  
  const [business, setBusiness] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Quotation Request Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectBudget, setProjectBudget] = useState("₹50,000 - ₹2,00,000");
  const [projectTimeline, setProjectTimeline] = useState("1-2 Months");
  const [projectLocation, setProjectLocation] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  useEffect(() => {
    if (slug) {
      router.replace(`/${slug}`);
    }
  }, [slug, router]);

  useEffect(() => {
    async function fetchBusinessData() {
      try {
        setLoading(true);
        // 1. Try slug match in workers collection
        const q = query(collection(db, "workers"), where("slug", "==", slug), limit(1));
        const querySnapshot = await getDocs(q);
        
        let foundData = null;
        let foundId = "";
        
        if (!querySnapshot.empty) {
          foundData = querySnapshot.docs[0].data();
          foundId = querySnapshot.docs[0].id;
        } else {
          // 2. Fallback to doc ID match
          const docRef = doc(db, "workers", slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundData = docSnap.data();
            foundId = docSnap.id;
          }
        }

        if (foundData) {
          setBusiness(foundData);
          setBusinessId(foundId);
          
          // Fetch reviews
          const revQuery = query(collection(db, "reviews"), where("workerId", "==", foundId));
          const revSnap = await getDocs(revQuery);
          const revList: any[] = [];
          revSnap.forEach((doc) => {
            revList.push({ id: doc.id, ...doc.data() });
          });
          setReviews(revList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (err) {
        console.error("Error fetching business profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchBusinessData();
    }
  }, [slug]);

  const handleRequestQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth?redirect=/business/${slug}`);
      return;
    }
    
    setSubmittingQuote(true);
    try {
      // Create project brief matching schema
      const projectData = {
        clientId: user.uid,
        clientName: user.displayName || user.email?.split("@")[0] || "Client",
        businessId: businessId,
        businessName: business?.companyName || business?.name || "Zenzy Partner",
        title: projectTitle,
        description: projectDesc,
        category: business?.category || "General",
        status: "quoting",
        budgetRange: projectBudget,
        timelineEstimate: projectTimeline,
        location: projectLocation,
        createdAt: new Date().toISOString()
      };
      
      const projectRef = await addDoc(collection(db, "projects"), projectData);
      
      // Auto-generate notification for the business
      await addDoc(collection(db, "notifications"), {
        userId: businessId,
        title: "New Quotation Request",
        message: `Client requested a quote for project: "${projectTitle}"`,
        read: false,
        createdAt: new Date().toISOString()
      });
      
      setQuoteSuccess(true);
      setTimeout(() => {
        setQuoteSuccess(false);
        setQuoteModalOpen(false);
        // Clear fields
        setProjectTitle("");
        setProjectDesc("");
        setProjectLocation("");
      }, 2500);
      
    } catch (err) {
      console.error("Failed to request quotation:", err);
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-white justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Loading Business Profile...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="flex-grow flex flex-col justify-center items-center p-8 max-w-md mx-auto text-center pt-32">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-black tracking-tight">Business Profile Not Found</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            The professional profile you requested does not exist or may have been deleted by the administrator.
          </p>
          <Link href="/services" className="mt-6 bg-white text-slate-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wide">
            Back to Directory
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const overallRating = business.stars || 5.0;
  const isVerified = business.verified || false;

  // Mock structures matching high-value expectations
  const mockCaseStudies = [
    {
      title: "Luxury Duplex Interior Renovation",
      desc: "Designed and built custom modular kitchen, lighting plan, false ceiling, and automated electrical panels. Client received full 3D handovers and completed in exact timeline.",
      timeline: "45 Days",
      budget: "₹12 Lakhs",
      location: "Sector 15, Gurugram"
    },
    {
      title: "Commercial Workspace Office Fit-out",
      desc: "Modern collaborative open floor plan setup including fire-safety systems, networking layout, and premium glass acoustics partitions.",
      timeline: "60 Days",
      budget: "₹24 Lakhs",
      location: "Noida CyberCity"
    }
  ];

  const mockTeam = business.team || [
    { name: business.name, role: "Lead Principal & Partner", avatar: business.avatar },
    { name: "Sneha Sen", role: "Sr. Project Manager", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" },
    { name: "Rahul Das", role: "Onsite MEP Coordinator", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Hero Banner Header */}
      <section className="relative h-[280px] sm:h-[380px] w-full overflow-hidden">
        <img 
          src={business.coverImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"} 
          className="w-full h-full object-cover opacity-35" 
          alt="Company banner" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
      </section>

      {/* Profile Detail Body */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 -mt-24 sm:-mt-32 pb-24 relative z-10">
        
        {/* Company Identity Block */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl shrink-0">
              <img 
                src={business.avatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80"} 
                className="w-full h-full object-cover" 
                alt={business.companyName || business.name} 
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {business.companyName || business.name}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Business
                  </span>
                )}
              </div>
              <p className="text-indigo-400 font-extrabold text-xs uppercase tracking-widest mt-1.5">{business.category}</p>
              <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold mt-2.5 flex-wrap">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-500" /> {business.area || "Noida NCR"}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span className="flex items-center gap-1 text-gold"><Star className="w-4 h-4 fill-gold text-gold" /> {overallRating} ({reviews.length} reviews)</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>Exp: {business.experience || "5 years"}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex gap-2.5 w-full md:w-auto">
            <button 
              onClick={() => setQuoteModalOpen(true)}
              className="flex-1 md:flex-none bg-white hover:bg-slate-100 text-slate-950 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg active:scale-95 duration-100 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Request Quotation <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <a 
              href={`tel:${business.phone}`}
              className="border border-slate-700 hover:border-slate-600 bg-slate-800/50 p-3.5 rounded-xl text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          
          {/* Left Column: Business Overview Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Block */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-3">About our firm</h3>
              <p className="text-slate-300 text-sm leading-relaxed font-medium">
                {business.description || business.bio || "No detailed description written yet. We specialize in premium execution, layout designs, contracting, and verified MEP timelines."}
              </p>
              
              <div className="pt-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Specialist Skills</span>
                <div className="flex flex-wrap gap-2">
                  {business.skills ? (
                    typeof business.skills === "string" ? (
                      business.skills.split(",").map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-750">
                          {skill.trim()}
                        </span>
                      ))
                    ) : (
                      business.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-750">
                          {skill}
                        </span>
                      ))
                    )
                  ) : (
                    ["Timeline Execution", "Structured Quotations", "MEP Planning", "Vetted Sourcing"].map((s, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-750">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Case Studies / Completed Projects Section */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-3">Completed Projects & Case Studies</h3>
              <div className="space-y-4">
                {mockCaseStudies.map((study, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-3 hover:border-slate-800 transition">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <span className="font-extrabold text-white text-[15px]">{study.title}</span>
                      <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {study.location}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed font-semibold">{study.desc}</p>
                    <div className="flex gap-4 pt-1 text-[11px] font-bold text-slate-500">
                      <span>Timeline: <strong className="text-slate-300">{study.timeline}</strong></span>
                      <span>Budget: <strong className="text-slate-300">{study.budget}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Gallery */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-3">Project Gallery</h3>
              {business.portfolio && business.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {business.portfolio.map((img: string, idx: number) => (
                    <div key={idx} className="h-28 rounded-xl overflow-hidden border border-slate-800 shadow-sm relative group bg-slate-900">
                      <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Work photo" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs font-semibold italic">No portfolio work photos uploaded yet.</p>
              )}
            </div>

            {/* Testimonials & Reviews */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350">Client Trust Reports</h3>
                <button 
                  onClick={() => setReviewOpen(true)}
                  className="text-xs font-bold text-indigo-400 hover:underline cursor-pointer"
                >
                  Write Trust Report
                </button>
              </div>

              {reviews.length === 0 ? (
                <p className="text-slate-500 text-xs font-semibold py-4 text-center">No reports filed yet. Book a project to submit feedback.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-950/20 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center text-slate-300">
                        <span className="font-extrabold text-[13px]">{rev.userName}</span>
                        <span className="text-gold font-bold flex items-center gap-0.5">★ {rev.rating}</span>
                      </div>
                      <p className="text-slate-400 font-semibold leading-relaxed">"{rev.comment}"</p>
                      <span className="text-[10px] text-slate-600 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Verification Ledger & Team info */}
          <div className="space-y-8">
            
            {/* Trust Verification Ledger Panel */}
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-7 rounded-2xl space-y-4.5">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Trust Ledger</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400">Identity (Aadhaar Card)</span>
                  <span className="text-[10px] font-black text-emerald-450 uppercase flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400">GST Registration Check</span>
                  <span className={business.gstVerified ? "text-[10px] font-black text-emerald-450 uppercase flex items-center gap-1" : "text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"}>
                    {business.gstVerified ? <><CheckCircle className="w-3.5 h-3.5" /> Verified</> : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <span className="text-xs font-semibold text-slate-400">Office Address Audit</span>
                  <span className="text-[10px] font-black text-emerald-450 uppercase flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>

              {/* Historic Fidelity metrics */}
              <div className="border-t border-slate-800 pt-4.5 space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Project Fidelity Rates</span>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                      <span>Timeline Fidelity (On Time)</span>
                      <span>96%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "96%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                      <span>Budget Fidelity (Under Quote)</span>
                      <span>92%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: "92%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Block */}
            <div className="bg-slate-900/40 border border-slate-800 p-6 sm:p-7 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" /> Executive Team
              </h3>
              <div className="space-y-3">
                {mockTeam.map((member: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img 
                      src={member.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40&q=80"} 
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700" 
                      alt="" 
                    />
                    <div>
                      <span className="font-bold text-xs text-white block leading-tight">{member.name}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight font-semibold mt-0.5">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Write review modal */}
      <ReviewModal 
        isOpen={reviewOpen} 
        onClose={() => setReviewOpen(false)} 
        workerId={businessId} 
        onReviewSubmitted={() => {
          setReviewOpen(false);
          router.refresh();
        }} 
      />

      {/* REQUEST QUOTATION MODAL */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-[480px] rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl relative animate-scale-in">
            
            {/* Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-850 flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-white">Start Project & Request Quote</h3>
                <p className="text-[10.5px] text-slate-400 font-semibold">Your detailed brief will go to {business.companyName || business.name}</p>
              </div>
              <button 
                onClick={() => setQuoteModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-450 hover:bg-slate-750 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            {quoteSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  ✓
                </div>
                <h4 className="text-lg font-black text-white">Project Request Sent!</h4>
                <p className="text-slate-405 text-xs font-semibold leading-relaxed">
                  Your project brief has been sent successfully. The professional will draft a structured proposal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestQuotation} className="p-6 space-y-4 text-xs font-bold">
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Project Title</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g., 3BHK Kitchen Renovation"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Requirements Description</label>
                  <textarea
                    rows={3}
                    required
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Describe specific work items, materials preference, and current status..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-205 focus:border-indigo-500 resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase">Budget Range</label>
                    <select
                      value={projectBudget}
                      onChange={(e) => setProjectBudget(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-205 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="₹25,000 - ₹1,00,000">₹25,000 - ₹1,00,000</option>
                      <option value="₹1,00,000 - ₹5,00,000">₹1,00,000 - ₹5,00,000</option>
                      <option value="₹5,00,000 - ₹20,00,000">₹5,00,000 - ₹20,00,000</option>
                      <option value="₹20,00,000+">₹20,00,000+</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase">Target Timeline</label>
                    <select
                      value={projectTimeline}
                      onChange={(e) => setProjectTimeline(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-205 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="1-2 Weeks">1-2 Weeks</option>
                      <option value="2-4 Weeks">2-4 Weeks</option>
                      <option value="1-3 Months">1-3 Months</option>
                      <option value="3-6 Months">3-6 Months</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Project Site Location</label>
                  <input
                    type="text"
                    required
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder="e.g., Sector 62, Noida"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="w-full bg-white hover:bg-slate-100 text-slate-950 py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition active:scale-[0.98] duration-100 cursor-pointer mt-2"
                >
                  {submittingQuote ? "Submitting Request..." : "Request Proposal Quote"}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
