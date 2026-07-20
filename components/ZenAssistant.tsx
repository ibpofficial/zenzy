"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, X, Send, AlertCircle, Brain, RefreshCw, User, ArrowRight, Loader2, Bot, MessageSquare, Zap, CheckCircle2, AlertTriangle, Info, ThumbsUp, Star, Clock, Calendar, MapPin, DollarSign, Users, Shield, Award } from "lucide-react";
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
  "ibpoffecial@gmail.com",
  "ibpofficial@gmail.com"
];

// Enhanced response formatter with better visual elements
const formatAIResponse = (content: string): string => {
  // Check for developer questions
  if (content.toLowerCase().includes("developed") ||
    content.toLowerCase().includes("created") ||
    content.toLowerCase().includes("made by") ||
    content.toLowerCase().includes("who made") ||
    content.toLowerCase().includes("who built") ||
    content.toLowerCase().includes("creator")) {
    return `✦ Developed by ISHANT UPADHYAY ✦\n\n▸ Passionate developer building innovative solutions\n▸ Creator of Zenzy platform\n▸ Tech enthusiast & problem solver`;
  }

  // Check for unusual/inappropriate questions
  const unusualKeywords = ["hack", "illegal", "steal", "cheat", "exploit", "crack", "password", "private", "secret"];
  if (unusualKeywords.some(keyword => content.toLowerCase().includes(keyword))) {
    return `⚠️ Warning: Unusual Query Detected\n\n✗ I'm designed for legitimate queries about services & bookings\n✗ Please ask appropriate questions within platform boundaries\n✗ Need help with something else? I'm here to assist!`;
  }

  // If content already has formatting, return as is
  if (content.includes("▸") || content.includes("•")) {
    return content;
  }

  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length <= 1) {
    return content;
  }

  // Format as bullet points with better symbols
  const formattedSentences = sentences.map((s, index) => {
    const trimmed = s.trim();
    if (!trimmed) return '';

    // Different bullet styles for variety
    const bullets = ['▸', '▪', '•', '◦', '›'];
    const bullet = bullets[index % bullets.length];

    return `  ${bullet} ${trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()}`;
  });

  // Add header with visual separator
  const header = `✦ ZEN's Response ✦\n\n`;
  const footer = `\n\n━ ━ ━ ━ ━ ━ ━ ━ ━\n💡 Anything else I can help with?`;

  // Clean up and combine
  const cleaned = formattedSentences.filter(s => s).join('\n');
  return header + cleaned + footer;
};

export default function ZenAssistant() {
  const { user, userData, role, openAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const isUnlimitedUser = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  const [isOpen, setIsOpen] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: formatAIResponse("Hello! I am ZEN, your AI Assistant. How can I help you today? I can guide you on booking services, check your booking history, or find rental properties.")
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState("");

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

  // Initialize subscriptions only on open to make initial loading instant
  useEffect(() => {
    if (isOpen && !isChatInitialized) {
      setIsChatInitialized(true);
    }
  }, [isOpen, isChatInitialized]);

  // Typing animation effect
  useEffect(() => {
    if (isTyping && typingText) {
      if (currentTypingIndex < typingText.length) {
        const timeout = setTimeout(() => {
          setDisplayedMessage(prev => prev + typingText[currentTypingIndex]);
          setCurrentTypingIndex(prev => prev + 1);
        }, 8); // Slightly faster typing animation for better UX
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
        setCurrentTypingIndex(0);
        setTypingText("");
        // Update messages with the fully typed response
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "assistant") {
            lastMessage.content = displayedMessage;
          }
          return newMessages;
        });
      }
    }
  }, [isTyping, typingText, currentTypingIndex, displayedMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // 1. Lazy Subscribe to AI Config in siteConfig
  useEffect(() => {
    if (!isChatInitialized) return;
    const unsub = onSnapshot(doc(db, "settings", "siteConfig"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setAiApiKey(d.aiApiKey || "");
        setAiUsageLimit(d.aiUsageLimit ?? 10);
      }
    });
    return () => unsub();
  }, [isChatInitialized]);

  // 2. Lazy Subscribe to current user's usage count and booking history
  useEffect(() => {
    if (!isChatInitialized || !user) {
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
  }, [isChatInitialized, user, role]);

  // 3. Track viewed worker details from pathname context (lazy loaded)
  useEffect(() => {
    if (!isChatInitialized) return;
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
  }, [isChatInitialized, pathname]);

  // Enhanced message rendering with better visual elements
  const renderMessageContent = (content: string, role: string) => {
    if (role === "user") return content;

    // Format the content with better visual elements
    const formatted = content.split('\n').map((line, index) => {
      if (line.startsWith('✦') && line.endsWith('✦')) {
        return <div key={index} className="text-center font-bold text-indigo-600 text-xs py-1 uppercase tracking-wider">{line}</div>;
      }
      if (line.startsWith('▸') || line.startsWith('▪') || line.startsWith('•') || line.startsWith('◦') || line.startsWith('›')) {
        return <div key={index} className="flex items-start gap-2 ml-1 py-1 text-slate-700 font-medium">
          <span className="text-indigo-500 font-bold shrink-0">▸</span>
          <span className="leading-relaxed">{line.replace(/^[▸▪•◦›]\s*/, '').trim()}</span>
        </div>;
      }
      if (line.includes('━')) {
        return <div key={index} className="text-center text-slate-300 my-2.5">━ ━ ━ ━ ━ ━</div>;
      }
      if (line.startsWith('⚠️')) {
        return <div key={index} className="text-amber-600 font-extrabold flex items-start gap-1.5 py-1.5 leading-relaxed">{line}</div>;
      }
      if (line.trim() === '') return <br key={index} />;
      return <div key={index} className="py-0.5 leading-relaxed text-slate-755 font-medium">{line}</div>;
    });

    return <>{formatted}</>;
  };

  const handleSendText = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    if (!user) {
      openAuthModal("login");
      return;
    }

    // Check usage limits
    if (queriesUsed >= aiUsageLimit && !isUnlimitedUser) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: promptText.trim() },
        {
          role: "assistant",
          content: formatAIResponse(`⚠️ You have reached your ZEN AI limit of ${aiUsageLimit} questions. Please contact the administrator to adjust your usage limits.`)
        }
      ]);
      return;
    }

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
      setQueriesUsed((prev) => prev + 1);

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
2. Keep responses SHORT and CONCISE (maximum 3-4 bullet points).
3. Use emojis sparingly but effectively.
4. If user asks about developer, respond with "ISHANT UPADHYAY".
5. Warn users about unusual/inappropriate questions.
6. Format responses in bullet points with symbols like ▸, ▪, •, ◦, ›.
7. Never use ** or any markdown bold/italic formatting.
8. try to give answers in short .
9. Keep it professional yet friendly.`;

      // Step 3: Trigger OpenRouter API
      if (!aiApiKey) {
        throw new Error("AI configuration is missing. OpenRouter API key has not been configured by the admin.");
      }

      // Convert message history to API format
      const apiHistory = messages.slice(-6).map((m) => ({
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
      let aiReply = resData.choices?.[0]?.message?.content || "I couldn't process that query. Please try again.";

      // Format the AI response
      aiReply = formatAIResponse(aiReply);

      // Add assistant message with empty content for typing animation
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Start typing animation
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
          content: formatAIResponse(`❌ ZEN is currently offline: ${error.message || "An unexpected connection issue occurred. Please check back later."}`)
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

  // Quick Suggestion Chips Config
  const SUGGESTIONS = [
    { text: "🔍 Find Electrician", prompt: "Suggest verified Electricians in my location." },
    { text: "📋 Booking History", prompt: "Show my current active bookings and their statuses." },
    { text: "🏡 Rent Studio PG", prompt: "Suggest zero-brokerage rental apartments or PGs." },
    { text: "💻 Creator Info", prompt: "Who built and designed the Zenzy platform?" }
  ];

  // Typing animation component with better visual
  const TypingIndicator = () => (
    <div className="max-w-[85%] mr-auto p-3 bg-slate-100/70 rounded-2xl rounded-tl-none flex items-center gap-2.5">
      <div className="flex gap-0.5 shrink-0">
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">thinking...</span>
    </div>
  );

  return createPortal(
    <div className="fixed bottom-20 right-5 md:bottom-6 md:right-6 z-[9999] font-sans">
      
      {/* Custom Styles Injector for smooth bottom drawer animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes zen-pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.45); transform: scale(1); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); transform: scale(1); }
        }
        @keyframes zen-slide-up-mobile {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zen-fade-in-desktop {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .zen-glow-action {
          animation: zen-pulse-glow 2.5s infinite;
        }
        .zen-drawer-mobile {
          animation: zen-slide-up-mobile 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .zen-drawer-desktop {
          animation: zen-fade-in-desktop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Launcher button with glowing pulsing animation */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-start w-12 hover:w-32 active:w-32 h-12 p-2.5 rounded-full bg-slate-950 border border-slate-800 text-white shadow-[0_12px_32px_rgba(99,102,241,0.22)] transition-all duration-300 relative group cursor-pointer backdrop-blur-md overflow-hidden zen-glow-action"
          title="Ask Zen AI Assistant"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-650 shadow-sm shrink-0">
            <Brain className="w-4 h-4 text-white animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5 ml-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <span className="text-[10px] font-black tracking-widest text-slate-200 uppercase">ZEN AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          </div>
        </button>
      )}

      {/* Expanded AI Panel (Highly responsive bottom-sheet on mobile, layout drawer on desktop) */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 left-0 w-full h-[85vh] md:relative md:bottom-auto md:right-auto md:left-auto md:w-[380px] md:h-[550px] bg-white/95 border-t border-slate-200 md:border md:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.12)] md:shadow-[0_24px_60px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden backdrop-blur-xl rounded-t-[28px] z-[9999] transition-all duration-300 zen-drawer-mobile md:zen-drawer-desktop">

          {/* Header */}
          <div className="bg-slate-950 text-white p-4.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-[14px] flex items-center gap-1.5">
                  ZEN Assistant
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Zenzy AI Bot</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Reset chat button */}
              <button
                onClick={() => {
                  if (confirm("Reset conversation chat history?")) {
                    setMessages([
                      {
                        role: "assistant",
                        content: formatAIResponse("Hello! I am ZEN, your AI Assistant. How can I help you today? I can guide you on booking services, check your booking history, or find rental properties.")
                      }
                    ]);
                  }
                }}
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
                title="Reset Conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Queries limit stats */}
          {user && (
            <div className="bg-slate-50 px-4.5 py-2 border-b text-[10px] font-extrabold text-slate-500 uppercase tracking-wide flex justify-between items-center shrink-0">
              <span>Usage Stats</span>
              <span className={queriesUsed >= aiUsageLimit && !isUnlimitedUser ? "text-red-500 font-black" : "text-indigo-600 font-black"}>
                {queriesUsed} / {isUnlimitedUser ? "∞" : aiUsageLimit} Queries
              </span>
            </div>
          )}

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4.5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex max-w-[82%] ${m.role === "user" ? "ml-auto" : "mr-auto"}`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed text-left ${m.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-sm"
                    : "bg-slate-100/70 text-slate-800 rounded-tl-none"
                  }`}
                >
                  {m.role === "assistant" && m.content === "" && isTyping ? (
                    <div className="text-indigo-600 whitespace-pre-wrap">
                      {displayedMessage}
                      <span className="inline-block w-0.5 h-3 bg-indigo-500 animate-pulse ml-0.5"></span>
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

          {/* Quick Suggestions Chips Carousel - Instant Interaction */}
          {user && !(queriesUsed >= aiUsageLimit && !isUnlimitedUser) && !loading && (
            <div className="px-4.5 py-1.5 shrink-0 overflow-x-auto flex gap-1.5 scrollbar-none bg-white border-t border-slate-100">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendText(chip.prompt)}
                  className="bg-slate-50 hover:bg-slate-100 text-indigo-650 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          )}

          {/* Footer input */}
          <div className="p-4 border-t bg-slate-50 shrink-0">
            {!user ? (
              <div className="text-center space-y-2 py-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Authenticate to consult ZEN AI</p>
                <button
                  onClick={() => openAuthModal("login")}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer border-none shadow-md shadow-indigo-600/10"
                >
                  Log In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2.5 items-center">
                <input
                  type="text"
                  placeholder={
                    (queriesUsed >= aiUsageLimit && !isUnlimitedUser)
                      ? "Query limit reached"
                      : "Consult ZEN AI..."
                  }
                  disabled={(queriesUsed >= aiUsageLimit && !isUnlimitedUser) || loading}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-grow px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-550 transition disabled:bg-slate-100 text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || loading || (queriesUsed >= aiUsageLimit && !isUnlimitedUser)}
                  className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer border-none hover:opacity-90 active:scale-95"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-inherit" />
                  ) : (
                    <Send className="w-4 h-4 text-inherit" />
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