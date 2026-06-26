"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Send, LifeBuoy, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { createPortal } from "react-dom";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function FloatingSupport() {
  const { user, userData, openAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-support-desk", handleOpen);
    return () => window.removeEventListener("open-support-desk", handleOpen);
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

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
      // Sort client-side desc by timestamp
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
        subject: subject.trim(),
        message: message.trim(),
        status: "Open",
        timestamp: new Date().toISOString()
      });

      setSubject("");
      setMessage("");
      setSuccessMsg("Ticket submitted! We will reply shortly.");
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
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in font-sans"
        onClick={() => setIsOpen(false)}
      >
        <div 
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/80 dark:border-slate-850/80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-600 dark:bg-primary-500 flex items-center justify-center">
                <LifeBuoy className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-[14px]">Zenzy Help Desk</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Average response time: &lt; 15 mins</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader Tabs */}
          {user && (
            <div className="flex bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-800 p-1.5 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("new")}
                className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "new"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-subtle"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white"
                }`}
              >
                New Ticket
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === "history"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-subtle"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white"
                }`}
              >
                History ({tickets.length})
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-5 max-h-[400px]">
            {!user ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-slate-350 dark:text-slate-600 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[15px] text-slate-900 dark:text-white">Authentication Required</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs px-4">
                    Please log in to your account to open support tickets and see answers.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openAuthModal("login");
                  }}
                  className="bg-slate-950 hover:bg-slate-850 dark:bg-white dark:text-slate-950 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer border-none active:scale-95"
                >
                  Log In Now
                </button>
              </div>
            ) : activeTab === "new" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {successMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/50 p-3.5 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-555 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">{successMsg}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Category / Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Booking refund query"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-all text-slate-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 block">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue or concern here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-all text-slate-850 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-slate-950 hover:bg-slate-850 dark:bg-white dark:text-slate-950 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Sending..." : "Submit Ticket"}
                </button>
              </form>
            ) : (
              /* History Tab */
              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-20 mb-2.5 animate-bounce" />
                    <p className="text-xs font-semibold">No tickets created yet.</p>
                    <p className="text-[10px] mt-0.5">Submit your first query on the New Ticket tab!</p>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      className="border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 space-y-2.5 text-left text-xs"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-extrabold text-slate-900 dark:text-white truncate flex-1">{t.subject}</span>
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          t.status === "Resolved"
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400"
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-slate-655 dark:text-slate-400 font-medium text-[11px] leading-relaxed break-words bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                        {t.message}
                      </p>
                      {t.reply && (
                        <div className="bg-primary-50/60 dark:bg-primary-950/15 border-l-2 border-primary-500 p-2.5 rounded-r-xl space-y-1">
                          <span className="text-[10px] font-bold text-primary-700 dark:text-primary-400 block">Agent Response:</span>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold leading-relaxed text-[11px] break-words">
                            {t.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 p-3.5 text-center shrink-0">
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-[10.5px] font-extrabold text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
            >
              Go to Help Center <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    ) : null,
    document.body
  );
}
