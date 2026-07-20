"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, LifeBuoy, AlertCircle, CheckCircle, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Clock, ShieldCheck, Ticket } from "lucide-react";
import { createPortal } from "react-dom";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const FAQS = [
  {
    q: "How do I track my service booking status?",
    a: "Track your service booking and communicate with your assigned professional directly in your Zenzy Workspace Portal."
  },
  {
    q: "What is Zenzy Escrow Payment Protection?",
    a: "Your payment is held securely in escrow and released to the professional only after you approve the completed work."
  },
  {
    q: "How can I request a refund or reschedule?",
    a: "Open a support ticket below or contact your professional directly through the Workspace Room before the scheduled appointment."
  },
  {
    q: "Are all professionals background verified?",
    a: "Yes. Every professional on Zenzy undergoes strict Aadhaar, PAN, and field work background verification."
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
      setSuccessMsg("Ticket submitted successfully. Our team will respond shortly.");
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
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Help Desk</h3>
                <p className="text-[11px] text-slate-500 font-medium">Support & assistance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 py-3 border-b border-slate-200/60 flex gap-1 bg-slate-50/50">
            {[
              { id: "new", label: "New Ticket", icon: MessageSquare },
              { id: "history", label: `Tickets (${tickets.length})`, icon: Ticket },
              { id: "faq", label: "FAQ", icon: HelpCircle }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 max-h-[440px]">
            {!user && activeTab !== "faq" ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm">Sign in to continue</h4>
                <p className="text-slate-500 text-xs mt-1 max-w-xs">Sign in to submit tickets and track your support requests.</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal("login");
                  }}
                  className="mt-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-6 py-2.5 rounded-lg transition-all active:scale-95"
                >
                  Sign In
                </button>
              </div>
            ) : activeTab === "new" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {successMsg && (
                  <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg p-3 flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 font-medium">{successMsg}</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[10px] font-medium px-3 py-1.5 rounded-lg border transition-all ${selectedCategory === cat
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:bg-white transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            ) : activeTab === "history" ? (
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-10">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">No tickets yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Submit your first support request</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div key={t.id} className="border border-slate-200 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            {t.category || "General"}
                          </span>
                          <p className="font-medium text-slate-900 text-sm mt-0.5">{t.subject}</p>
                        </div>
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${t.status === "Resolved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                          }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm bg-slate-50 rounded-lg p-3">
                        {t.message}
                      </p>
                      {t.reply && (
                        <div className="bg-slate-50 rounded-lg p-3 border-l-2 border-slate-300">
                          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
                            Agent Response
                          </p>
                          <p className="text-slate-700 text-sm">{t.reply}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {FAQS.map((faq, idx) => {
                  const isOpenFaq = openFaqIdx === idx;
                  return (
                    <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpenFaq ? null : idx)}
                        className="w-full px-4 py-3 text-left flex justify-between items-center gap-3 text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors"
                      >
                        <span>{faq.q}</span>
                        {isOpenFaq ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpenFaq && (
                        <div className="px-4 pb-3 text-sm text-slate-600 border-t border-slate-100 pt-2.5 bg-slate-50/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Secure support</span>
            </div>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              Help Center
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
}