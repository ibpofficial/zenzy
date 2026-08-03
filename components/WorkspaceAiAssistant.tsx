"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, X, FileText, CheckCircle, Clock, IndianRupee } from "lucide-react";
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
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; timestamp: string }[]
  >([
    {
      sender: "ai",
      text: `Hello! I am your Zenzy AI Project Assistant for "${project.title}". Ask me about remaining work, pending payments, timeline summaries, or daily reports based strictly on your live project data.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");

  const generateAnswer = (query: string): string => {
    const qLower = query.toLowerCase();

    // 1. Work Left Query
    if (qLower.includes("work is left") || qLower.includes("remaining work") || qLower.includes("work left")) {
      const remainingMilestones = milestones.filter((m) => m.status !== "completed");
      const progress = project.progressPercent ?? 0;
      if (remainingMilestones.length === 0) {
        return `🎉 All ${milestones.length} milestones are completed! Overall execution is at 100%.`;
      }
      const listStr = remainingMilestones
        .map((m) => `• ${m.title} (${m.progressPercent || 0}% progress${m.deadline ? `, deadline: ${m.deadline}` : ""})`)
        .join("\n");
      return `📊 **Current Overall Progress:** ${progress}%\n\n**${remainingMilestones.length} Milestone(s) Remaining:**\n${listStr}`;
    }

    // 2. Pending Payments Query
    if (qLower.includes("pending payment") || qLower.includes("show pending") || qLower.includes("payments")) {
      const pending = paymentRequests.filter((p) => p.status === "pending");
      const totalPending = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (pending.length === 0) {
        return `✅ There are currently **no pending payment requests**. All submitted payments are processed.`;
      }
      const listStr = pending
        .map((p) => `• ₹${p.amount.toLocaleString()} for "${p.description}" (Requested on ${new Date(p.requestedAt).toLocaleDateString()})`)
        .join("\n");
      return `💳 **Pending Payments (${pending.length} request(s), Total: ₹${totalPending.toLocaleString()}):**\n${listStr}`;
    }

    // 3. Summarize Last Week Query
    if (qLower.includes("summarize last week") || qLower.includes("weekly summary") || qLower.includes("summary")) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentEvents = events.filter((e) => new Date(e.createdAt).getTime() >= sevenDaysAgo);
      const recentLogs = dailyLogs.filter((l) => new Date(l.createdAt || l.date).getTime() >= sevenDaysAgo);

      if (recentEvents.length === 0 && recentLogs.length === 0) {
        return `ℹ️ No logged timeline events or site daily reports were recorded in the past 7 days.`;
      }

      const logBullets = recentLogs
        .flatMap((l) => l.workSummary)
        .slice(0, 5)
        .map((b) => `• ${b}`)
        .join("\n");

      return `📅 **Past 7 Days Project Activity Summary:**\n\n• Total Timeline Events Logged: **${recentEvents.length}**\n• Site Daily Logs Submitted: **${recentLogs.length}**\n\n**Key Work Executed:**\n${logBullets || "• Routine site updates executed."}`;
    }

    // 4. Daily Report Query
    if (qLower.includes("daily report") || qLower.includes("today's report") || qLower.includes("generate report")) {
      if (dailyLogs.length === 0) {
        return `ℹ️ No site daily progress logs have been published yet by the contractor.`;
      }
      const latestLog = dailyLogs[0];
      return `📋 **Latest Site Daily Report (${latestLog.date}):**\n\n• **Workers Present:** ${latestLog.workersPresent} workers\n• **Hours Worked:** ${latestLog.hoursWorked} hrs\n• **Work Summary:**\n${latestLog.workSummary.map((w) => `  - ${w}`).join("\n")}${latestLog.issues ? `\n\n⚠️ **Site Issue:** ${latestLog.issues}` : ""}${latestLog.tomorrowPlan ? `\n\n📌 **Tomorrow's Plan:** ${latestLog.tomorrowPlan}` : ""}`;
    }

    // Default Context-Aware Answer
    return `ℹ️ **Project Snapshot for "${project.title}":**\n• **Current Stage:** ${project.currentStage || "Execution Phase"}\n• **Progress:** ${project.progressPercent || 0}%\n• **Trust Score:** ${project.projectTrustScore || 85}/100\n• **Total Events Logged:** ${events.length}\n• **Total Documents Vaulted:** ${documents.length}`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userMsg = inputQuery.trim();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const answerText = generateAnswer(userMsg);

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMsg, timestamp: time },
      { sender: "ai", text: answerText, timestamp: time }
    ]);
    setInputQuery("");
  };

  return (
    <>
      {/* Floating AI Assistant Trigger Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all duration-300 transform hover:scale-105 cursor-pointer border border-indigo-400/30 ring-4 ring-indigo-500/20"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
          <span>AI Project Assistant</span>
        </button>
      )}

      {/* AI Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-white block">Zenzy AI Assistant</span>
                <span className="text-[9px] text-indigo-300 font-semibold block">Scoped to Live Project Events</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Trigger Chips */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200/60 flex gap-2 overflow-x-auto hide-scrollbar text-[10px] font-bold">
            {[
              { label: "Work Left?", query: "How much work is left?" },
              { label: "Pending Payments?", query: "Show pending payments" },
              { label: "Weekly Summary", query: "Summarize last week" },
              { label: "Daily Report", query: "Generate daily report" }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(chip.query);
                }}
                className="bg-white hover:bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs whitespace-nowrap transition cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="p-4 flex-1 h-80 overflow-y-auto space-y-3 custom-scrollbar bg-slate-50/50 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed whitespace-pre-line font-medium ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none shadow-sm"
                      : "bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[8.5px] text-slate-400 font-semibold mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about progress, payments, reports..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium placeholder-slate-400"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
