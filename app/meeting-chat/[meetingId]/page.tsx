"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  Send,
  MessageSquare,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  User,
  Briefcase,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Phone,
  Video,
  Mail,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Users,
  Star,
  Shield,
  Clock as ClockIcon,
  CalendarDays,
  MapPinned,
  FileText,
  MessageCircle,
  ThumbsUp,
  Smile,
  Paperclip,
  Mic,
  Image as ImageIcon,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";

export default function MeetingChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const meetingId = params?.meetingId as string;

  const [meeting, setMeeting] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch meeting metadata
  useEffect(() => {
    if (!meetingId || !user) return;

    const fetchMeeting = async () => {
      try {
        const mRef = doc(db, "meetings", meetingId);
        const mSnap = await getDoc(mRef);

        if (!mSnap.exists()) {
          setError("Meeting details not found.");
          setLoading(false);
          return;
        }

        const mData: any = { id: mSnap.id, ...mSnap.data() };
        setMeeting(mData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching meeting:", err);
        setError("An error occurred while loading this meeting discussion.");
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [meetingId, user]);

  // Sync chat messages in real time
  useEffect(() => {
    if (!meetingId || error || loading) return;

    const q = query(
      collection(db, "meetings", meetingId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs: any[] = [];
      snap.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [meetingId, error, loading]);

  // Auto-scroll to the bottom of chat thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !user || !meeting) return;

    if (!textToSend) setInputText("");

    const senderName = user.displayName || user.email?.split("@")[0] || "User";

    try {
      await addDoc(collection(db, "meetings", meetingId, "messages"), {
        senderId: user.uid,
        senderName: senderName,
        text: text,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Unable to send message. Please check connection.");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickReplies = [
    { icon: <ThumbsUp className="w-3 h-3" />, label: "Got it" },
    { icon: <ClockIcon className="w-3 h-3" />, label: "Running late" },
    { icon: <MapPinned className="w-3 h-3" />, label: "Arrived" },
    { icon: <CalendarDays className="w-3 h-3" />, label: "Reschedule" },
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !meeting) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-100">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{error || "Unable to access the chat."}</p>
          <button
            onClick={() => router.back()}
            className="w-full py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const isUserWorker = meeting.workerId === user?.uid || meeting.businessId === user?.uid;
  const participantName = isUserWorker
    ? (meeting.customerName || "Client")
    : (meeting.workerName || "Verified Contractor");

  const statusColors = {
    Confirmed: "from-emerald-400 to-emerald-500 bg-emerald-100 text-emerald-700",
    Cancelled: "from-rose-400 to-rose-500 bg-rose-100 text-rose-700",
    Completed: "from-blue-400 to-blue-500 bg-blue-100 text-blue-700",
    Pending: "from-amber-400 to-amber-500 bg-amber-100 text-amber-700",
  };

  const renderSidebar = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Sidebar Header: 3 dots left, arrow button back right. No text. */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800"
            aria-label="More Options"
          >
            <MoreVertical className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-800"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-none">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              Meeting Schedule
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-xs text-slate-650 font-medium p-3 bg-white/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-bold">Meeting Date</span>
                  <strong className="text-slate-800 font-semibold text-sm">
                    {new Date(meeting.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </strong>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-650 font-medium p-3 bg-white/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-bold">Meeting Time</span>
                  <strong className="text-slate-800 font-semibold text-sm">{meeting.time}</strong>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-650 font-medium p-3 bg-white/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-400 text-[9px] uppercase tracking-wider font-bold">Consultation Site</span>
                  <strong className="text-slate-800 font-semibold text-sm">{meeting.location}</strong>
                </div>
              </div>
            </div>
          </div>

          {meeting.notes && (
            <div className="pt-4 border-t border-slate-200/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Meeting Notes
              </h3>
              <div className="bg-gradient-to-br from-slate-50/80 to-white p-4 rounded-2xl text-xs text-slate-600 italic leading-relaxed border border-slate-200/50 shadow-sm">
                "{meeting.notes}"
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200/50 space-y-3.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Participants
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 p-2.5 bg-white/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className="block text-slate-800 leading-tight text-sm">{meeting.customerName || "Customer"}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Client Role
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 p-2.5 bg-white/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center shadow-sm">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <span className="block text-slate-800 leading-tight text-sm">{meeting.workerName || "Contractor"}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-amber-400" /> Verified Contractor
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col font-sans overflow-hidden relative">
      {/* Mobile Drawer (Sidebar) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
            />
            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 p-6 flex flex-col justify-between shadow-2xl md:hidden"
            >
              {renderSidebar()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Static Sidebar */}
        <aside className="hidden md:flex w-80 bg-white/60 backdrop-blur-sm border-r border-slate-200/60 p-6 flex-col justify-between shrink-0">
          {renderSidebar()}
        </aside>

        {/* Central Chat Stream Section */}
        <main className="flex-1 flex flex-col bg-gradient-to-b from-slate-50/30 to-white h-full relative overflow-hidden">
          {/* Floating Action Buttons for mobile (since there is no top navbar) */}
          <div className="md:hidden absolute top-4 left-4 z-40 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white/95 backdrop-blur-md shadow-md hover:shadow-lg rounded-2xl border border-slate-200/60 text-slate-600 hover:text-slate-900 transition-all"
              aria-label="Open sidebar details"
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>
          </div>
          <div className="md:hidden absolute top-4 right-4 z-40 flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-3 bg-white/95 backdrop-blur-md shadow-md hover:shadow-lg rounded-2xl border border-slate-200/60 text-slate-600 hover:text-slate-900 transition-all"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-20 md:pt-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200/50">
                    <MessageCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Start of Consultation Chat</p>
                    <p className="text-xs text-slate-400 max-w-[280px] mt-1 leading-relaxed">
                      Use this discussion panel to align on project parameters, timelines, design updates or site access requirements.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">
                      Secure
                    </span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100">
                      Real-time
                    </span>
                  </div>
                </motion.div>
              ) : (
                messages.map((m, index) => {
                  const isMe = m.senderId === user?.uid;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}
                    >
                      <span className="text-[10px] text-slate-400 font-bold mb-1 px-2 flex items-center gap-1.5">
                        {isMe ? (
                          <span className="text-emerald-500">●</span>
                        ) : (
                          <span className="text-blue-400">●</span>
                        )}
                        {isMe ? "You" : m.senderName}
                      </span>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed shadow-sm ${isMe
                          ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none shadow-slate-200"
                          : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-slate-100"
                          }`}
                      >
                        <p className="break-words">{m.text}</p>
                        <span
                          className={`text-[9px] mt-1.5 block text-right font-mono ${isMe ? "text-slate-400" : "text-slate-400"
                            }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </motion.div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies Panel */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="px-4 py-2.5 border-t border-slate-200/50 bg-white/40 backdrop-blur-sm flex gap-2 overflow-x-auto print:hidden shrink-0 scrollbar-none"
          >
            {quickReplies.map((reply, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleSendMessage(reply.label)}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 rounded-xl transition-all duration-200 shrink-0 cursor-pointer shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
              >
                {reply.icon}
                {reply.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Chat Form Input */}
          <motion.footer
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 flex gap-3 shrink-0 sticky bottom-0 shadow-lg shadow-slate-100"
          >
            <form onSubmit={handleFormSubmit} className="flex-1 flex gap-2.5">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type a message to ${participantName}...`}
                  className="w-full px-5 py-3.5 border border-slate-200/80 text-sm rounded-2xl outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all duration-200 bg-white/50 backdrop-blur-sm font-medium placeholder:text-slate-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-400 hover:text-slate-600"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-slate-400 hover:text-slate-600"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputText.trim()}
                className="w-12 h-12 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.footer>
        </main>
      </div>
    </div>
  );
}