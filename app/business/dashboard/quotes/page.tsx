"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, addDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Info, 
  Calculator, 
  Signature,
  FileCheck,
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface QuoteItem {
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export default function QuoteComposerPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [invitations, setInvitations] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Line items state
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "Site prep & demolition", qty: 1, unitPrice: 15000, total: 15000 }
  ]);
  const [materialsCost, setMaterialsCost] = useState(25000);
  const [laborCost, setLaborCost] = useState(20000);
  const [terms, setTerms] = useState("1. 50% advance before project kickoff.\n2. 40% on layout milestone completion.\n3. 10% on client verification handover.");
  const [esignSignature, setEsignSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchQuoteInvites() {
      if (!user) return;
      try {
        setLoading(true);
        // Query invitations for this professional/business
        const q = query(
          collection(db, "quotations"),
          where("businessId", "==", user.uid),
          where("status", "==", "draft")
        );
        const snap = await getDocs(q);
        const list: any[] = [];
        
        for (const docSnap of snap.docs) {
          const qData = docSnap.data();
          // Fetch project details for the quote
          const projRef = doc(db, "projects", qData.projectId);
          const projSnap = await getDoc(projRef);
          let projectDetails = null;
          if (projSnap.exists()) {
            projectDetails = projSnap.data();
          }
          
          list.push({
            id: docSnap.id,
            ...qData,
            project: projectDetails
          });
        }
        setInvitations(list);
      } catch (err) {
        console.error("Failed to fetch quote invites:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuoteInvites();
  }, [user]);

  // Recalculating item totals
  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === "description") {
        updated[index].description = value;
      } else {
        const numVal = parseFloat(value) || 0;
        updated[index][field] = numVal as never;
        updated[index].total = updated[index].qty * updated[index].unitPrice;
      }
      return updated;
    });
  };

  const addLineItem = () => {
    setItems((prev) => [...prev, { description: "", qty: 1, unitPrice: 0, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const lineItemsTotal = items.reduce((acc, curr) => acc + curr.total, 0);
  const quoteTotal = lineItemsTotal + materialsCost + laborCost;

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote || !user) return;
    if (!esignSignature.trim()) {
      alert("Please sign to confirm e-signature terms.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update quotation document
      const quoteRef = doc(db, "quotations", selectedQuote.id);
      await updateDoc(quoteRef, {
        items,
        materialsCost,
        laborCost,
        terms,
        esignSignature,
        status: "submitted",
        total: quoteTotal,
        submittedAt: new Date().toISOString()
      });

      // 2. Update project status to quoting
      const projRef = doc(db, "projects", selectedQuote.projectId);
      await updateDoc(projRef, {
        status: "quoting",
        businessId: user.uid,
        businessName: selectedQuote.businessName
      });

      // 3. Notify client
      if (selectedQuote.project?.clientId) {
        await addDoc(collection(db, "notifications"), {
          userId: selectedQuote.project.clientId,
          title: "Proposal Received",
          message: `Professional "${selectedQuote.businessName}" submitted a quote for: "${selectedQuote.project.title}"`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedQuote(null);
        // Remove from local list
        setInvitations((prev) => prev.filter((i) => i.id !== selectedQuote.id));
      }, 2500);

    } catch (err) {
      console.error("Failed to submit quotation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-955 text-white justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Loading Quote Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-5xl mx-auto w-full px-5 pt-28 pb-24">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/worker/dashboard" className="text-xs font-bold text-slate-450 hover:text-white flex items-center gap-1.5 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Business Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 space-y-1">
          <h1 className="text-2.5xl font-black text-white tracking-tight">Structured Quotation Composer</h1>
          <p className="text-slate-400 text-xs font-semibold">
            {!selectedQuote ? "Review incoming RFP project briefs and generate professional proposal quotes." : `Drafting Quotation for project: "${selectedQuote.project?.title}"`}
          </p>
        </div>

        {!selectedQuote ? (
          /* LIST OF INVITATIONS */
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-350 border-b border-slate-800 pb-3">Open RFPs / Invitations</h3>
            
            {invitations.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-10 h-10 text-slate-60 pointer-events-none mx-auto mb-3 opacity-25" />
                <p className="text-slate-400 text-sm font-semibold">No pending quotation requests found.</p>
                <p className="text-slate-500 text-[11px] mt-1.5 max-w-xs mx-auto leading-relaxed">
                  When clients view your premium business profile, they can invite you to submit bids directly for their projects.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invite) => (
                  <div key={invite.id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-750 transition group">
                    <div className="space-y-1.5">
                      <span className="font-extrabold text-[15px] text-white block">{invite.project?.title || "Project Inquiry"}</span>
                      <p className="text-slate-400 text-xs line-clamp-2 max-w-xl font-medium leading-relaxed">"{invite.project?.description}"</p>
                      <div className="flex gap-4 pt-1 text-[10px] font-bold text-slate-500">
                        <span>Target Budget: <strong className="text-slate-300">{invite.project?.budgetRange}</strong></span>
                        <span>Timeline: <strong className="text-slate-300">{invite.project?.timelineEstimate}</strong></span>
                        <span>Site: <strong className="text-slate-300">{invite.project?.location}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuote(invite);
                        // Reset defaults
                        setItems([{ description: `${invite.project?.title || "Site prep"} - Core Work`, qty: 1, unitPrice: 15000, total: 15000 }]);
                        setEsignSignature("");
                      }}
                      className="bg-white hover:bg-slate-100 text-slate-950 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition shrink-0 active:scale-95 duration-100 flex items-center gap-1 cursor-pointer"
                    >
                      Draft Bid Quote <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* COMPOSER WORKSPACE FORM */
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500 rounded-full blur-[90px] opacity-10 pointer-events-none"></div>

            {success ? (
              <div className="text-center py-20 space-y-4 animate-scale-in">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h3 className="text-lg font-black text-white">Quotation Proposal Submitted!</h3>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm mx-auto">
                  Your bid invoice has been sent to the client. They will review and accept it to spin up the Project Workspace.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuote} className="space-y-6 text-xs font-bold">
                
                {/* Brief metadata banner */}
                <div className="bg-slate-955/60 p-4 border border-slate-850 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Project Brief Summary</span>
                  <p className="text-slate-300 font-semibold text-xs leading-relaxed">"{selectedQuote.project?.description}"</p>
                  <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                    <span>Budget Range: <strong className="text-slate-350">{selectedQuote.project?.budgetRange}</strong></span>
                    <span>Site: <strong className="text-slate-350">{selectedQuote.project?.location}</strong></span>
                  </div>
                </div>

                {/* Line Items Builder Section */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-xs uppercase tracking-wider text-slate-400">Line Items & Tasks</span>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-950/20 border border-slate-850 p-3.5 rounded-xl">
                        
                        <div className="col-span-12 sm:col-span-6 space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase">Item Description</label>
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                            placeholder="e.g. Demolition & floor concrete prep"
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase">Quantity</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                          />
                        </div>

                        <div className="col-span-5 sm:col-span-3 space-y-1">
                          <label className="text-[9px] text-slate-500 uppercase">Unit Price (₹)</label>
                          <input
                            type="number"
                            required
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                          />
                        </div>

                        <div className="col-span-3 sm:col-span-1 text-center pt-4">
                          <button
                            type="button"
                            disabled={items.length === 1}
                            onClick={() => removeLineItem(idx)}
                            className="p-2 text-slate-500 hover:text-red-500 disabled:opacity-30 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional costs block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Materials Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={materialsCost}
                      onChange={(e) => setMaterialsCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Labor & Supervision (₹)</label>
                    <input
                      type="number"
                      required
                      value={laborCost}
                      onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Terms and conditions */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block">Payment Milestones & Execution Terms</label>
                  <textarea
                    rows={4}
                    required
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-205 focus:border-indigo-500 resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Real-time Calculation Panel */}
                <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl space-y-2.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5" /> Live Quote Audit Sheet
                  </span>
                  
                  <div className="space-y-2 text-xs font-semibold text-slate-400">
                    <div className="flex justify-between">
                      <span>Core Line Items Total</span>
                      <span>₹{lineItemsTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materials Procurement Sourcing</span>
                      <span>₹{materialsCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor & Supervision Payroll</span>
                      <span>₹{laborCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-[15px] font-black text-white">
                      <span>Total Quotation Bid</span>
                      <span>₹{quoteTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* E-Signature & Agreement */}
                <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Signature className="w-3.5 h-3.5 text-indigo-400" /> Digital Sign-Off Authorization
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                      Signing indicates this quotation accurately projects execution budgets and materials terms under your warranty.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-450 uppercase">Type Full Legal Name / Business Representative</label>
                    <input
                      type="text"
                      required
                      value={esignSignature}
                      onChange={(e) => setEsignSignature(e.target.value)}
                      placeholder="e.g. Ishant Upadhyay, CEO"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl outline-none text-slate-200 focus:border-indigo-500 font-semibold font-mono tracking-wide"
                    />
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuote(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-350 py-4 rounded-xl font-bold text-xs uppercase cursor-pointer transition text-center"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] bg-white hover:bg-slate-100 text-slate-950 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition active:scale-[0.99] duration-100 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    {submitting ? "Submitting Bid Proposal..." : "Submit Signed Proposal"}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
