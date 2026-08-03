"use client";

import React, { useState, useEffect, useRef } from "react";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Send, MessageSquare } from "lucide-react";

interface MeetingChatModalProps {
  meetingId: string;
  onClose: () => void;
  currentUser: any;
  currentUserName: string;
}

export default function MeetingChatModal({
  meetingId,
  onClose,
  currentUser,
  currentUserName,
}: MeetingChatModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync messages in real time
  useEffect(() => {
    if (!meetingId) return;

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
  }, [meetingId]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      await addDoc(collection(db, "meetings", meetingId, "messages"), {
        senderId: currentUser.uid,
        senderName: currentUserName,
        text: messageText,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs text-left">
      <div className="bg-white max-w-md w-full h-[500px] flex flex-col border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Meeting Discussion Chat</h3>
              <p className="text-[10px] text-slate-400">Offline Meeting consultation live notes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-white text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold">No messages yet.</p>
              <p className="text-[10px] max-w-[200px]">Send a message to start discussing site inspection details or parameters.</p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === currentUser.uid;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] text-slate-400 font-bold mb-0.5 px-1">
                    {isMe ? "You" : m.senderName}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium leading-relaxed ${
                      isMe
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white border border-slate-200 text-slate-805 rounded-tl-none"
                    }`}
                  >
                    <p className="break-words">{m.text}</p>
                    <span
                      className={`text-[8.5px] mt-1 block text-right font-mono ${
                        isMe ? "text-slate-450" : "text-slate-400"
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

        {/* Input area */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 border border-slate-200 text-xs rounded-xl outline-none focus:border-slate-450 transition font-semibold"
          />
          <button
            type="submit"
            className="w-10 h-10 bg-slate-900 hover:bg-slate-805 text-white rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
