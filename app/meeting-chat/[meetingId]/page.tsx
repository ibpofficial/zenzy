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
  AlertCircle
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

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
  
  const chatEndRef = useRef<HTMLDivElement>(null);

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

    // Determine sender name
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

  const quickReplies = [
    "Hi, I have arrived at the location.",
    "Running a few minutes late.",
    "Ready to start the review.",
    "Could we reschedule the inspection time?",
  ];

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 p-8 rounded-2xl max-w-md w-full shadow-lg space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500">{error || "Unable to access the chat."}</p>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition duration-150 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isUserWorker = meeting.workerId === user?.uid || meeting.businessId === user?.uid;
  const participantName = isUserWorker 
    ? (meeting.customerName || "Client") 
    : (meeting.workerName || "Verified Contractor");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"
              title="Return"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-left">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Discussion with {participantName}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Meeting Ref: #{meeting.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
              meeting.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
              meeting.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
              meeting.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {meeting.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Split Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar - Meeting Meta (Desktop only) */}
        <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Offline Meeting Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs text-slate-650 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase">Meeting Date</span>
                    <strong className="text-slate-800 font-semibold">{new Date(meeting.date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-650 font-medium">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase">Meeting Time</span>
                    <strong className="text-slate-800 font-semibold">{meeting.time}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs text-slate-650 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-400 text-[10px] uppercase">Consultation Site</span>
                    <strong className="text-slate-800 font-semibold">{meeting.location}</strong>
                  </div>
                </div>
              </div>
            </div>

            {meeting.notes && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Meeting Agenda / Notes</h3>
                <div className="bg-slate-50/70 p-3 rounded-xl text-xs text-slate-600 italic leading-relaxed border border-slate-100">
                  "{meeting.notes}"
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discussion Participants</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <span className="block text-slate-800 leading-tight">{meeting.customerName || "Customer"}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium">Client Role</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div>
                  <span className="block text-slate-800 leading-tight">{meeting.workerName || "Contractor"}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-medium">Verified Contractor</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Chat Stream Section */}
        <main className="flex-1 flex flex-col bg-slate-50/50 h-[calc(100vh-140px)] md:h-[calc(100vh-62px)] relative">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xs border border-slate-100">
                  <MessageSquare className="w-6 h-6 text-slate-350" />
                </div>
                <p className="text-xs font-bold text-slate-850">Start of Consultation Chat</p>
                <p className="text-[10px] text-slate-400 max-w-[280px]">
                  Use this discussion panel to align on project parameters, timelines, design updates or site access requirements.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === user?.uid;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}
                  >
                    <span className="text-[9px] text-slate-400 font-bold mb-0.5 px-2">
                      {isMe ? "You" : m.senderName}
                    </span>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs shadow-3xs font-medium leading-relaxed ${
                        isMe
                          ? "bg-slate-900 text-white rounded-tr-none"
                          : "bg-white border border-slate-150 text-slate-805 rounded-tl-none"
                      }`}
                    >
                      <p className="break-words font-semibold">{m.text}</p>
                      <span
                        className={`text-[8.5px] mt-1.5 block text-right font-mono ${
                          isMe ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies Panel */}
          <div className="px-4 py-2 border-t border-slate-200/50 bg-white/30 flex gap-2 overflow-x-auto print:hidden shrink-0 scrollbar-none">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(reply)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold border border-slate-200 rounded-xl transition duration-150 shrink-0 cursor-pointer shadow-3xs active:scale-95"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Chat Form Input */}
          <footer className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0 sticky bottom-0">
            <form onSubmit={handleFormSubmit} className="flex-1 flex gap-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type a message to ${participantName}...`}
                className="flex-1 px-4 py-3 border border-slate-255 text-xs rounded-xl outline-none focus:border-slate-805 focus:ring-1 focus:ring-slate-805 transition font-bold"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer shadow-sm active:scale-95 disabled:opacity-30 disabled:scale-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
