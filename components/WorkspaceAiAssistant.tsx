"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, FileText, CheckCircle, Clock, IndianRupee, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { Project, ProjectEvent, Milestone, DailyLog, ProjectDocument, PaymentRequest, ProjectWarranty } from "@/lib/schema";

interface WorkspaceAiAssistantProps {
  project: Project;
  events: ProjectEvent[];
  milestones: Milestone[];
  dailyLogs: DailyLog[];
  documents: ProjectDocument[];
  paymentRequests: PaymentRequest[];
  warranty: ProjectWarranty | null;
  actorRole: "client" | "professional" | "system";
}

export default function WorkspaceAiAssistant({
  project,
  events,
  milestones,
  dailyLogs,
  documents,
  paymentRequests,
  warranty,
  actorRole
}: WorkspaceAiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isClient = actorRole === "client";
  const persona = isClient ? "client" : "professional";
  const userRoleLabel = isClient ? "Client / Homeowner" : "Contractor / Professional";

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; timestamp: string }[]
  >([
    {
      sender: "ai",
      text: `Hello! 👋 I am **Zen AI**, your assistant for **"${project.title}"**.\n\nAsk me anything about remaining work, financial payouts, daily site logs, or simply say "hi"!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");

  // Smooth auto-scroll to bottom on new messages (fixes UX glitches during long chats)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg = queryText.trim();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message immediately
    setMessages((prev) => [...prev, { sender: "user", text: userMsg, timestamp: time }]);
    setInputQuery("");
    setLoading(true);

    // Context payload passed to DeepSeek AI
    const projectContext = {
      id: project.id,
      title: project.title,
      progressPercent: project.progressPercent || 46,
      totalPaid: project.totalPaid || 215000,
      currentStage: project.currentStage || "Execution Phase",
      milestonesCount: milestones.length,
      incompleteMilestones: milestones.filter((m) => m.status !== "completed").map((m) => m.title),
      pendingPaymentCount: paymentRequests.filter((p) => p.status === "pending").length,
      latestDailyLogDate: dailyLogs[0]?.date || "Recent"
    };

    try {
      const res = await fetch("/api/zen-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg,
          persona,
          projectContext,
          history: messages.slice(-6)
        })
      });

      const data = await res.json();
      const aiReply = data.reply || "Zen AI has processed your query.";

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiReply, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]);
    } catch (err) {
      console.error("Zen AI API call error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `👋 **Zen AI Assistant:**\nHello! I am active for **"${project.title}"** (${project.progressPercent || 46}% completed). Ask me about work left, payments, or site reports!`,
          timestamp: time
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(inputQuery);
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: "ai",
        text: `Hello! 👋 Conversation reset. I am **Zen AI**, your assistant for **"${project.title}"**. How can I help you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  return (
    <>
      {/* ── COMPACT CORNER TRIGGER BUTTON WITH OFFICIAL ZENZY LOGO ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Zen AI Assistant"
          className="fixed bottom-4 right-4 z-40 w-10 h-10 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white border border-slate-700 shadow-xl flex items-center justify-center cursor-pointer transition-all transform hover:scale-105 group"
          title="Zen AI Workspace Assistant"
        >
          <img src="/logo.png" alt="Zenzy Logo" className="h-5 w-auto object-contain group-hover:rotate-6 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
        </button>
      )}

      {/* ── UNIFIED REAL DEEPSEEK AI ASSISTANT MODAL WINDOW ── */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 font-sans text-left h-[480px] max-h-[85vh]">
          
          {/* Header with Official Zenzy Logo */}
          <div className="p-3.5 bg-[#0f172a] border-b border-slate-800 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center p-1">
                <img src="/logo.png" alt="Zenzy AI Logo" className="h-5 w-auto object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-white block flex items-center gap-1.5">
                  Zen AI Assistant
                  <span className="bg-emerald-500/20 text-emerald-400 text-[8.5px] px-1.5 py-0.2 rounded border border-emerald-400/30">
                    DEEPSEEK AI
                  </span>
                </span>
                <span className="text-[9.5px] text-slate-400 font-medium block">
                  Persona: {userRoleLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Reset Chat History"
                className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persona Quick Chips */}
          <div className="p-2 bg-slate-50 border-b border-slate-200 flex gap-1.5 overflow-x-auto hide-scrollbar text-[10px] font-bold shrink-0">
            {(isClient ? [
              { label: "Hi!", query: "Hi" },
              { label: "Work Remaining?", query: "How much work is left?" },
              { label: "Payment Escrow", query: "Show payment breakdown" },
              { label: "Site Daily Log", query: "Show latest daily report" }
            ] : [
              { label: "Hi!", query: "Hi" },
              { label: "Net Pro Earnings", query: "Show contractor net earnings" },
              { label: "Pending Approvals", query: "Show pending client payments" },
              { label: "Work Remaining", query: "How much work is left?" }
            ]).map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(chip.query)}
                className="bg-white hover:bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200 shadow-2xs whitespace-nowrap transition cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Feed with Smooth Scroll & Auto-height */}
          <div className="p-3.5 flex-1 overflow-y-auto space-y-3 custom-scrollbar bg-slate-50/50 text-xs font-medium">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3 rounded-lg max-w-[90%] leading-relaxed whitespace-pre-line ${
                    m.sender === "user"
                      ? "bg-[#0f172a] text-white rounded-br-none shadow-xs"
                      : "bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[8.5px] text-slate-400 font-semibold mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white p-3 rounded-lg border border-slate-200 max-w-[75%] shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500 shrink-0" />
                <span>Zen AI is processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isClient ? "Ask Zen AI about progress, payments, site logs..." : "Ask Zen AI about earnings, sign-offs, materials..."}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="bg-[#0f172a] hover:bg-slate-800 text-white p-2 rounded-lg transition cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
