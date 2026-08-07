"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RefreshCw,
  Zap,
  HelpCircle,
  TrendingUp,
  UserCheck,
  Building,
  ShieldCheck,
  CheckCircle2,
  FileText,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ZenAssistant() {
  const pathname = usePathname();
  const { user, userData, role, openAuthModal } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [queriesUsed, setQueriesUsed] = useState(0);
  const [isChatInitialized, setIsChatInitialized] = useState(false);

  // Viewed Worker Context (for profile pages)
  const [viewedWorker, setViewedWorker] = useState<any>(null);
  // User Active Bookings Context
  const [userBookings, setUserBookings] = useState<any[]>([]);

  // Typing animation state
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, displayedMessage, loading]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format AI response to add structured visual cues
  const formatAIResponse = (text: string): string => {
    if (!text) return text;
    let formatted = text;
    formatted = formatted.replace(/(?:^|\n)#+\s*(.*?)(?=\n|$)/g, '\n✦ $1 ✦\n');
    formatted = formatted.replace(/(?:^|\n)-\s*(.*?)(?=\n|$)/g, '\n▸ $1');
    formatted = formatted.replace(/(?:^|\n)\*\s*(.*?)(?=\n|$)/g, '\n▸ $1');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    return formatted.trim();
  };

  // Helper to convert URLs & internal paths to bright blue clickable links
  const renderTextWithClickableLinks = (text: string) => {
    const linkRegex = /(https?:\/\/[^\s]+|\/(?:dashboard|business|services|rent|shop|workspace|projects|notifications|worker|profile|admin|quotations|invoices)[^\s]*)/g;
    const parts = text.split(linkRegex);

    return parts.map((part, i) => {
      if (part.match(linkRegex)) {
        const cleanHref = part.replace(/[.,!?;:]$/, "");
        return (
          <Link
            key={i}
            href={cleanHref}
            onClick={() => setIsOpen(false)}
            className="text-blue-600 font-bold underline hover:text-blue-800 transition inline-flex items-center gap-0.5 mx-0.5"
          >
            {cleanHref}
          </Link>
        );
      }
      return part;
    });
  };

  // Enhanced message rendering with clickable blue links
  const renderMessageContent = (content: string, role: string) => {
    if (role === "user") return content;

    const formatted = content.split('\n').map((line, index) => {
      if (line.startsWith('✦') && line.endsWith('✦')) {
        return (
          <div key={index} className="text-center font-bold text-indigo-600 text-[10px] py-1 uppercase tracking-wider">
            {line}
          </div>
        );
      }
      if (line.startsWith('▸') || line.startsWith('▪') || line.startsWith('•') || line.startsWith('◦') || line.startsWith('›')) {
        const rawContent = line.replace(/^[▸▪•◦›]\s*/, '').trim();
        return (
          <div key={index} className="flex items-start gap-2 py-0.5 text-slate-800">
            <span className="text-indigo-500 font-bold shrink-0 text-xs">▸</span>
            <span className="leading-relaxed">{renderTextWithClickableLinks(rawContent)}</span>
          </div>
        );
      }
      if (line.startsWith('⚠️')) {
        return (
          <div key={index} className="text-amber-700 font-semibold flex items-start gap-2 py-1 leading-relaxed">
            {renderTextWithClickableLinks(line)}
          </div>
        );
      }
      if (line.trim() === '') return <br key={index} />;
      return (
        <div key={index} className="py-0.5 leading-relaxed text-slate-800">
          {renderTextWithClickableLinks(line)}
        </div>
      );
    });

    return <>{formatted}</>;
  };

  // Usage limits calculation
  const aiUsageLimit = (userData?.zenQueriesLimit as number) ?? 15;
  const isUnlimitedUser = role === "admin" || role === "super_admin" || userData?.isUnlimitedAi === true;

  // Initialize Chat & load usage statistics
  useEffect(() => {
    if (!mounted || isChatInitialized) return;

    const initChat = async () => {
      if (user) {
        try {
          const collName = role === "worker" ? "workers" : "users";
          const snap = await getDoc(doc(db, collName, user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setQueriesUsed(data.zenQueriesCount || 0);
          }
        } catch (e) {
          console.error("Failed to load user AI query count:", e);
        }
      }

      setMessages([
        {
          role: "assistant",
          content: formatAIResponse(
            "Hello! 👋 I am **ZEN**, your official AI Assistant for Zenzy.\n\nI can answer anything about your live project workspaces, CRM lead pipeline, net earnings, quotes, escrow safety, or guide you anywhere on Zenzy!"
          )
        }
      ]);
      setIsChatInitialized(true);
    };

    initChat();
  }, [mounted, user, role, isChatInitialized]);

  // Typing animation effect
  useEffect(() => {
    if (isTyping && currentTypingIndex < typingText.length) {
      const timeout = setTimeout(() => {
        setDisplayedMessage((prev) => prev + typingText[currentTypingIndex]);
        setCurrentTypingIndex((prev) => prev + 1);
      }, 12);
      return () => clearTimeout(timeout);
    } else if (isTyping && currentTypingIndex >= typingText.length) {
      setIsTyping(false);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1].content = typingText;
        }
        return updated;
      });
    }
  }, [isTyping, currentTypingIndex, typingText]);

  // 3. Track viewed worker details from pathname context
  useEffect(() => {
    if (!isChatInitialized) return;
    const fetchViewedWorker = async () => {
      setViewedWorker(null);
      const pathParts = pathname.split("/");
      const workerIdx = pathParts.indexOf("worker");
      if (workerIdx !== -1 && pathParts[workerIdx + 1] && pathParts[workerIdx + 1] !== "dashboard") {
        const workerId = pathParts[workerIdx + 1];
        try {
          const snap = await getDoc(doc(db, "workers", workerId));
          if (snap.exists()) {
            setViewedWorker({ id: snap.id, ...snap.data() });
          }
        } catch (e) {
          console.error("Failed to load viewed worker context:", e);
        }
      }
    };
    fetchViewedWorker();
  }, [isChatInitialized, pathname]);

  const handleSendText = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    if (queriesUsed >= aiUsageLimit && !isUnlimitedUser) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: promptText.trim() },
        {
          role: "assistant",
          content: formatAIResponse(`⚠️ You have reached your ZEN AI limit of ${aiUsageLimit} questions. Please contact administrator to upgrade.`)
        }
      ]);
      return;
    }

    setLoading(true);

    const userMessage: Message = { role: "user", content: promptText };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const collName = role === "worker" ? "workers" : "users";
      await updateDoc(doc(db, collName, user.uid), {
        zenQueriesCount: queriesUsed + 1
      });
      setQueriesUsed((prev) => prev + 1);

      const aiApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

      const systemPrompt = `You are ZEN, the official, highly intelligent AI Platform Guide & Workspace Consultant for Zenzy (India's leading operating system for service businesses and renovation projects).

Comprehensive Zenzy Platform & Workflow Knowledge:
1. CUSTOMER CRM SUITE (/business/dashboard/crm):
   - Priority Action Calls, AI Quote Generator, 360 Customer Profiles, Lead Pipeline Board, GST Invoices.
2. LIVE WORKSPACE (/workspace/[projectId]):
   - 12 Execution Hubs: Overview, Milestones & Stages, Daily Site Reports, Decision Center, Issues & Changes, Progress Gallery, Payments & Escrow, Categorized Documents, Material Tracker, Team Roster, Health & Completion, Chat & Notes.
3. ESCROW & FINANCIAL SECURITY:
   - 5% Zenzy Platform Fee & 95% Net Contractor Payout.
   - 2-Way Milestone Release: Contractor requests sign-off, Customer inspects and releases funds.
4. SERVICES & SHOP (/services, /shop, /rent):
   - Background-verified professionals, zero-brokerage rentals, verified material stores.

Direct Platform Navigation Links (ALWAYS provide as clickable path text, e.g. /dashboard or /business/dashboard/crm):
- Customer Dashboard: /dashboard
- Customer CRM & Quotes: /dashboard?tab=quotations
- Professional CRM: /business/dashboard/crm
- Live Workspace List: /business/dashboard/projects
- Invoices & Finance: /business/dashboard/finance
- Service Marketplace: /services
- Equipment Store: /shop

User Context:
- User Name: ${userData?.name || user.displayName || user.email || "User"}
- User Email: ${user.email}
- User Role: ${role || "Customer"}
- Current URL Path: ${pathname}

AI Response Rules:
1. Present yourself as ZEN, the official Zenzy AI Guide.
2. Provide exact direct clickable links (e.g. /business/dashboard/crm) whenever answering navigation or workflow queries.
3. Be warm, clear, and structured in bullet points.`;

      if (!aiApiKey) {
        throw new Error("AI configuration is missing.");
      }

      const apiHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiApiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://zenzy.shop",
          "X-Title": "Zenzy AI Assistant"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            ...apiHistory,
            { role: "user", content: promptText }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error (Status ${response.status})`);
      }

      const resData = await response.json();
      let aiReply = resData.choices?.[0]?.message?.content || "I am processing your query.";

      aiReply = formatAIResponse(aiReply);

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      setTypingText(aiReply);
      setDisplayedMessage("");
      setCurrentTypingIndex(0);
      setIsTyping(true);

    } catch (error: any) {
      console.error("ZEN AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: formatAIResponse(`Hello! I am **ZEN**, your platform assistant. You can manage your projects at /dashboard or view your CRM suite at /business/dashboard/crm.`)
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    const val = inputValue;
    setInputValue("");
    await handleSendText(val);
  };

  if (!mounted) return null;
  if (pathname === "/shop") return null;

  const isWorkspacePage = pathname?.startsWith("/workspace/");

  const SUGGESTIONS = isWorkspacePage
    ? [
        { text: "Work Remaining?", prompt: "How much work is left in this workspace project?" },
        { text: "Pending Payments?", prompt: "Show pending milestone payment requests." },
        { text: "CRM Suite", prompt: "How do I access my professional CRM pipeline at /business/dashboard/crm?" },
        { text: "Escrow Protection", prompt: "How does 2-way milestone escrow verification work?" }
      ]
    : [
        { text: "CRM Suite", prompt: "Show me my professional CRM suite at /business/dashboard/crm." },
        { text: "Active Projects", prompt: "Where can I view my live project workspaces?" },
        { text: "Escrow Rules", prompt: "How does 5% platform fee and escrow protection work?" },
        { text: "Find Electrician", prompt: "Suggest verified Electricians in my location." }
      ];

  const TypingIndicator = () => (
    <div className="max-w-[85%] mr-auto p-3 bg-slate-50 rounded-2xl rounded-tl-none flex items-center gap-2">
      <div className="flex gap-1 shrink-0">
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Zen AI Thinking...</span>
    </div>
  );

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes zen-pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(15, 23, 42, 0.4); transform: scale(1); }
          70% { box-shadow: 0 0 0 10px rgba(15, 23, 42, 0); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(15, 23, 42, 0); transform: scale(1); }
        }
        .zen-glow-action {
          animation: zen-pulse-glow 2.8s infinite;
        }
      `}} />

      {/* Launcher button with OFFICIAL WEBSITE LOGO */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-start w-11 hover:w-32 active:w-32 h-11 px-2 rounded-xl bg-[#0f172a] border border-slate-700 text-white shadow-xl transition-all duration-300 relative group cursor-pointer backdrop-blur-sm overflow-hidden zen-glow-action"
          title="Ask Zen AI Assistant"
        >
          <div className="w-7 h-7 rounded-md bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200 overflow-hidden">
            <img src="/logo.png" alt="Zenzy Logo" className="max-w-full max-h-full object-contain object-center group-hover:rotate-6 transition-transform" />
          </div>

          <div className="flex items-center gap-1.5 ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="text-[10.5px] font-black tracking-wider text-slate-200 uppercase">Zen AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          </div>
        </button>
      )}

      {/* Expanded AI Panel with OFFICIAL WEBSITE LOGO Header */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 left-0 w-full h-[85vh] md:relative md:bottom-auto md:right-auto md:left-auto md:w-[390px] md:h-[560px] bg-white border-t border-slate-100 md:border md:rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl z-[9999] transition-all duration-300 font-sans text-left">
          
          {/* Header with Official Website Logo */}
          <div className="bg-[#0f172a] text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs border border-slate-200 overflow-hidden">
                <img src="/logo.png" alt="Zenzy Brand Logo" className="max-w-full max-h-full object-contain object-center" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-xs text-white flex items-center gap-1.5">
                  Zen Assistant
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">AI-powered guidance</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      role: "assistant",
                      content: formatAIResponse("Hello! 👋 Conversation reset. I am **ZEN**, your AI Assistant. How can I help you today?")
                    }
                  ]);
                }}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-md cursor-pointer"
                title="Reset Conversation"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Usage limit indicator */}
          {user && (
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center shrink-0">
              <span>Usage Stats</span>
              <span className={queriesUsed >= aiUsageLimit && !isUnlimitedUser ? "text-rose-600 font-black" : "text-emerald-700 font-mono font-black"}>
                {queriesUsed} / {isUnlimitedUser ? "∞" : aiUsageLimit} queries
              </span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 scrollbar-thin bg-slate-50/40 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex max-w-[88%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-xs leading-relaxed text-left font-medium ${
                    m.role === "user"
                      ? "bg-[#0f172a] text-white rounded-tr-none shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-2xs"
                  }`}
                >
                  {m.role === "assistant" && m.content === "" && isTyping ? (
                    <div className="text-indigo-600 font-bold whitespace-pre-wrap">
                      {displayedMessage}
                      <span className="inline-block w-0.5 h-3 bg-indigo-600 animate-pulse ml-0.5"></span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {renderMessageContent(m.content, m.role)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && !isTyping && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>

          {/* Preset Chips */}
          {user && !(queriesUsed >= aiUsageLimit && !isUnlimitedUser) && !loading && (
            <div className="px-4 py-2 shrink-0 overflow-x-auto flex gap-1.5 scrollbar-none border-t border-slate-100 bg-white">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendText(chip.prompt)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-3 py-1 rounded-md transition cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          )}

          {/* Footer Input */}
          <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
            {!user ? (
              <div className="text-center space-y-2 py-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log in to consult Zen AI</p>
                <button
                  onClick={() => openAuthModal("login")}
                  className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={
                    (queriesUsed >= aiUsageLimit && !isUnlimitedUser)
                      ? "Query limit reached"
                      : "Ask Zen AI about website & work..."
                  }
                  disabled={(queriesUsed >= aiUsageLimit && !isUnlimitedUser) || loading}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-indigo-500 transition disabled:bg-slate-100 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading || (queriesUsed >= aiUsageLimit && !isUnlimitedUser)}
                  className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center shrink-0 shadow-2xs transition disabled:opacity-40 cursor-pointer hover:bg-slate-800"
                >
                  {loading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}