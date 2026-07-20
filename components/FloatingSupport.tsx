"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, LifeBuoy, AlertCircle, CheckCircle, ExternalLink, HelpCircle, Phone, Sparkles, ChevronDown, ChevronUp, Clock, ShieldCheck, Ticket } from "lucide-react";
import { createPortal } from "react-dom";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const FAQS = [
  {
    q: "How do I track my service booking status?",
    a: "You can track your service booking and communicate with your assigned professional directly in your Zenzy Workspace Portal."
  },
  {
    q: "What is Zenzy Escrow Payment Protection?",
    a: "Your payment is held safely in escrow and only released to the professional once you inspect and approve the completed work."
  },
  {
    q: "How can I request a refund or reschedule?",
    a: "Open a support ticket below or contact your professional directly through the Workspace Room before the scheduled appointment."
  },
  {
    q: "Are all professionals background verified?",
    a: "Yes! Every active professional on Zenzy undergoes strict Aadhaar, PAN, and field work background verification."
  }
];

const CATEGORIES = [
  "Booking & Appointment",
  "Escrow & Payment",
  "Refund Request",
  "Worker Inquiry",
  "Account & Verification",
  "General Support"
];

export default function FloatingSupport() {
  const { user, userData, openAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history" | "faq">("new");
  const [selectedCategory, setSelectedCategory] = useState("Booking & Appointment");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-support-desk", handleOpen);
    return () => window.removeEventListener("open-support-desk", handleOpen);
  }, []);

  // Listen to user's tickets in real-time
  useEffect(() => {
    if (!user || !isOpen) return;

    const q = query(
      collection(db, "supportTickets"),
      where("customerId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const tA = a.timestamp?.seconds || new Date(a.timestamp || 0).getTime() / 1000;
        const tB = b.timestamp?.seconds || new Date(b.timestamp || 0).getTime() / 1000;
        return tB - tA;
      });
      setTickets(list);
    });

    return () => unsub();
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "supportTickets"), {
        customerId: user.uid,
        customerName: userData?.name || user.email || "Client",
        customerEmail: user.email || "",
        category: selectedCategory,
        subject: subject.trim(),
        message: message.trim(),
        status: "Open",
        timestamp: new Date().toISOString()
      });

      setSubject("");
      setMessage("");
      setSuccessMsg("Ticket submitted successfully! Our help desk will respond shortly.");
      setActiveTab("history");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Support submit error: ", err);
      alert("Failed to submit support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    isOpen ? (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm animate-fade-in font-sans"
        onClick={() => setIsOpen(false)}
      >
        <div 
          className="w-full max-w-lg bg-white rounded-[28px] border border-slate-200/90 shadow-[0_25px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-scale-in text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header matching Zenzy Help Desk Clean Home Style */}
          <div className="bg-white border-b border-slate-200/80 p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100/80 rounded-2xl text-indigo-600 shrink-0 shadow-xs">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight">Zenzy Help Desk</h3>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Submit support tickets, track issues & instant resolution</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader Segmented Tabs */}
          <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200/60 flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab("new")}
              className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "new"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Ticket
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              My Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "faq"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/60"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Quick FAQs
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 max-h-[420px]">
            {!user && activeTab !== "faq" ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-base text-slate-900">Sign In to Zenzy Help Desk</h4>
                  <p className="text-slate-500 text-xs px-4 max-w-sm font-medium leading-relaxed">
                    Log in to submit priority tickets, receive live notifications, and track agent replies.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal("login");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-6 py-3 rounded-2xl shadow-md transition cursor-pointer active:scale-95"
                >
                  Log In Now
                </button>
              </div>
            ) : activeTab === "new" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-emerald-900 leading-relaxed">{successMsg}</p>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10.5px] font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subject / Short Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need assistance with booking reschedule"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about your query, booking ID, or requirement..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 transition-all text-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting Ticket..." : "Submit Support Ticket"}
                </button>
              </form>
            ) : activeTab === "history" ? (
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-20 mb-2" />
                    <p className="text-xs font-extrabold text-slate-700">No support tickets found.</p>
                    <p className="text-[10px] text-slate-400">Submit a query under the New Ticket tab to get help.</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      className="border border-slate-200/80 p-4 rounded-2xl bg-white shadow-xs space-y-2.5 text-left text-xs"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider block">{t.category || "General"}</span>
                          <span className="font-extrabold text-slate-900 text-xs block mt-0.5">{t.subject}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          t.status === "Resolved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {t.message}
                      </p>
                      {t.reply && (
                        <div className="bg-indigo-50/70 border border-indigo-100 p-3 rounded-xl space-y-1">
                          <span className="text-[10px] font-black text-indigo-700 block flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-600" /> Zenzy Agent Response:
                          </span>
                          <p className="text-slate-800 font-semibold leading-relaxed text-xs">
                            {t.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* FAQ TAB */
              <div className="space-y-2.5">
                {FAQS.map((faq, idx) => {
                  const isOpenFaq = openFaqIdx === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpenFaq ? null : idx)}
                        className="w-full p-3.5 text-left flex justify-between items-center gap-3 font-extrabold text-xs text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        {isOpenFaq ? (
                          <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpenFaq && (
                        <div className="px-3.5 pb-3.5 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-2 bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean Premium Footer */}
          <div className="bg-slate-50 border-t border-slate-200/60 p-4 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Certified Zenzy Support</span>
            </div>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 hover:underline"
            >
              Full Help Directory <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
}

