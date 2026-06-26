"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, AlertCircle, Brain, RefreshCw, User, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";
import { collection, doc, query, where, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const ADMIN_EMAILS = [
  "ishantpbupadhyay@gmail.com",
  "25tec2cs089@vgu.ac.in",
  "ibpoffecial@gmail.com"
];

export default function ZenAssistant() {
  const { user, userData, role, openAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const pathname = usePathname();
  const isUnlimitedUser = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am ZEN, your AI Assistant. How can I help you today? I can guide you on booking services, check your booking history, or find rental properties."
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Real-time AI Configuration from siteConfig
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiUsageLimit, setAiUsageLimit] = useState(10);
  
  // Real-time User's queries count
  const [queriesUsed, setQueriesUsed] = useState(0);
  
  // Real-time user bookings context
  const [userBookings, setUserBookings] = useState<any[]>([]);
  
  // Context of currently viewed worker
  const [viewedWorker, setViewedWorker] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 1. Subscribe to AI Config in siteConfig
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAiApiKey(d.aiApiKey || "");
        setAiUsageLimit(d.aiUsageLimit ?? 10);
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to current user's usage count and booking history
  useEffect(() => {
    if (!user) {
      setQueriesUsed(0);
      setUserBookings([]);
      return;
    }

    const collName = role === "worker" ? "workers" : "users";
    const userDocRef = doc(db, collName, user.uid);
    const unsubUser = onSnapshot(userDocRef, (snap) => {
      if (snap.exists()) {
        setQueriesUsed(snap.data().zenQueriesCount || 0);
      }
    });

    // Load bookings context
    const qField = role === "worker" ? "workerId" : "customerId";
    const qBookings = query(
      collection(db, "bookings"),
      where(qField, "==", user.uid)
    );
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() });
      });
      setUserBookings(list);
    });

    return () => {
      unsubUser();
      unsubBookings();
    };
  }, [user, role]);

  // 3. Track viewed worker details from pathname context
  useEffect(() => {
    const fetchViewedWorker = async () => {
      setViewedWorker(null);
      // Path format: /worker/[id]
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
  }, [pathname]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    // Check usage limits
    if (queriesUsed >= aiUsageLimit && !isUnlimitedUser) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: inputValue.trim() },
        {
          role: "assistant",
          content: `⚠️ You have reached your ZEN AI limit of ${aiUsageLimit} questions. Please contact the administrator to adjust your usage limits.`
        }
      ]);
      setInputValue("");
      return;
    }

    const promptText = inputValue.trim();
    setInputValue("");
    setLoading(true);

    // Append user message instantly
    const userMessage: Message = { role: "user", content: promptText };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Step 1: Increment query count in Firestore
      const collName = role === "worker" ? "workers" : "users";
      await updateDoc(doc(db, collName, user.uid), {
        zenQueriesCount: queriesUsed + 1
      });

      // Step 2: Build Context Prompt
      const bookingSummary = userBookings.length > 0
        ? userBookings.map((b) => `- Category: ${b.workerCategory}, Provider: ${b.workerName}, Date: ${b.date}, Time: ${b.time}, Status: ${b.status}, Price: ₹${b.price}`).join("\n")
        : "No active bookings found.";

      let workerSummary = "None (user is not currently viewing any worker profile).";
      if (viewedWorker) {
        workerSummary = `Name: ${viewedWorker.name}, Category: ${viewedWorker.category || "General"}, Price: ${viewedWorker.pricing || "₹350/hr"}, Rating: ${viewedWorker.stars || 5.0}★, Experience: ${viewedWorker.experience || "2 years"}, Service Area: ${viewedWorker.serviceArea || "Delhi NCR"}, Status: ${viewedWorker.status || "Available"}`;
      }

      const systemPrompt = `You are ZEN, the premium AI query assistant for Zenzy.
Zenzy is India's most transparent local service marketplace connecting clients directly to verified professionals (AC Technicians, Plumbers, Electricians, House Workers, etc.) with 0% intermediate markups.
Zenzy also features zero-brokerage rental property searches (studio apartments, family BHKs, PGs). Payments can be made via Cash (COD) or UPI QR scanning.

Current User Context:
- User Name: ${userData?.name || user.displayName || user.email || "Guest"}
- User Email: ${user.email}
- User Role: ${role || "Customer"}
- Current URL path: ${pathname}
- User Booking History:
${bookingSummary}
- Currently Viewed Worker Profile:
${workerSummary}

AI Assistant Rules:
1. Always present yourself as ZEN, a helpful, polite, and witty AI companion.
2. If the user is trying to find a worker or booking a service, you MUST ask clarifying questions/cross-question them to refine their needs (e.g. location, budget, timing).
3. If they are having trouble finding a worker and are currently looking at a worker's profile (details available in Viewed Worker context), mention details about that worker specifically, highlight their pricing and reviews, and encourage them to click the "Book Now" or "WhatsApp" action on the page.
4. If they ask about their active bookings, refer directly to their Booking History context and give them exact statuses.
5. Answer questions about how Zenzy works: direct connections, zero markups, KYC verification done by admins, and support tickets filed via the right-side support desk widget.
6. Keep your answers concise, structured, and action-oriented.`;

      // Step 3: Trigger OpenRouter API
      if (!aiApiKey) {
        throw new Error("AI configuration is missing. OpenRouter API key has not been configured by the admin.");
      }

      // Convert message history to API format (limit history length to keep context short)
      const apiHistory = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${aiApiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://zenzy.com",
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
      const aiReply = resData.choices?.[0]?.message?.content || "I couldn't process that query. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
    } catch (error: any) {
      console.error("ZEN AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `❌ ZEN is currently offline: ${error.message || "An unexpected connection issue occurred. Please check back later."}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 z-[9999] font-sans">
      {/* Sleek Glassmorphic Launcher Capsule (Rounded Full & Mobile Responsive) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-start w-12 hover:w-32 active:w-32 h-12 p-2.5 rounded-full bg-slate-950 dark:bg-slate-900 border border-slate-800 dark:border-slate-850 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.25)] transition-all duration-300 relative group cursor-pointer backdrop-blur-md overflow-hidden"
          title="Ask ZEN AI Assistant"
        >
          {/* Subtle animated gradient outer glow border */}
          <div className="absolute -inset-px bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300 -z-10"></div>
          
          {/* Compact glowing brain icon */}
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-650 shadow-sm shrink-0">
            <Brain className="w-4 h-4 text-white animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5 ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="text-[10px] font-black tracking-widest text-slate-200 uppercase">ZEN AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          </div>
        </button>
      )}

      {/* Expanded AI Panel */}
      {isOpen && (
        <div className="w-[360px] max-w-[calc(100vw-32px)] h-[520px] bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-slate-900 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden backdrop-blur-xl animate-scale-in relative">
          
          {/* Ambient Glow Orb */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-primary-600 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

          {/* Header */}
          <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-md">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-[14px] flex items-center gap-1.5">
                  ZEN Assistant
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Zenzy Contextual AI Bot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Queries limit stats banner */}
          {user && (
            <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b dark:border-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex justify-between items-center shrink-0">
              <span>Usage Stats:</span>
              <span className={queriesUsed >= aiUsageLimit && !isUnlimitedUser ? "text-red-500 font-extrabold animate-pulse" : "text-primary-600 dark:text-primary-400"}>
                {queriesUsed} / {isUnlimitedUser ? "Unlimited" : `${aiUsageLimit} questions asked`}
              </span>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${
                    m.role === "user"
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350"
                      : "bg-gradient-to-tr from-primary-600 to-indigo-600 text-white"
                  }`}
                >
                  {m.role === "user" ? "Me" : "ZN"}
                </div>
                <div
                  className={`p-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary-600 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-850/50 text-slate-800 dark:text-slate-200 border border-slate-200/40 dark:border-slate-800/40 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  ZN
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-850/50 rounded-2xl rounded-tl-none border border-slate-200/40 dark:border-slate-800/40 flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  ZEN is typing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer input form */}
          <div className="p-3.5 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
            {!user ? (
              <div className="text-center space-y-2 py-1.5">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Authenticate to query ZEN AI</p>
                <button
                  onClick={() => openAuthModal("login")}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer border-none"
                >
                  Log In Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={
                    (queriesUsed >= aiUsageLimit && !isUnlimitedUser)
                      ? "Limit reached"
                      : "Ask ZEN anything about services..."
                  }
                  disabled={(queriesUsed >= aiUsageLimit && !isUnlimitedUser) || loading}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-primary-500 dark:focus:border-primary-400 transition disabled:bg-slate-100 dark:disabled:bg-slate-950 text-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading || (queriesUsed >= aiUsageLimit && !isUnlimitedUser)}
                  className="w-9 h-9 rounded-xl bg-slate-950 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shrink-0 shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none hover:opacity-90 active:scale-95"
                >
                  <Send className="w-4 h-4" />
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
