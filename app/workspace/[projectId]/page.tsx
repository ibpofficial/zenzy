"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc, getDocs, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  FileText, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  DollarSign, 
  Send, 
  Paperclip, 
  Calendar, 
  MapPin, 
  Briefcase, 
  AlertTriangle,
  Clock,
  ChevronRight,
  Info,
  CheckCircle,
  FileDown,
  Upload
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function WorkspacePage({ params }: PageProps) {
  const routeParams = useParams();
  const projectId = routeParams?.projectId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Escrow Wallet states (persisted locally on project doc)
  const [escrowTotal, setEscrowTotal] = useState(150000);
  const [escrowFunded, setEscrowFunded] = useState(50000);
  const [escrowReleased, setEscrowReleased] = useState(0);

  // Milestones (stored on project doc as array of structures)
  const [milestones, setMilestones] = useState<any[]>([
    { id: 1, title: "Blueprint & Layout Sign-off", status: "Verified Complete", date: "2026-07-01", weight: 20 },
    { id: 2, title: "Sourcing & Materials Sourcing", status: "Verified Complete", date: "2026-07-03", weight: 30 },
    { id: 3, title: "MEP & Masonry Second Fix", status: "In Progress", date: "Awaiting start", weight: 30 },
    { id: 4, title: "Finishing & Handovers Inspection", status: "Awaiting Start", date: "Awaiting start", weight: 20 }
  ]);

  // Documents array
  const [documents, setDocuments] = useState<any[]>([
    { name: "Architectural_Blueprint_v2.pdf", size: "4.2 MB", uploadedBy: "Ishant (Pro)", date: "2026-07-01" },
    { name: "Signed_Project_Agreement.pdf", size: "1.8 MB", uploadedBy: "Rahul (Client)", date: "2026-07-02" }
  ]);

  useEffect(() => {
    if (!projectId) return;

    // 1. Fetch project doc
    async function fetchProject() {
      try {
        setLoading(true);
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          
          // Seed state from doc parameters if available
          if (data.escrowTotal) setEscrowTotal(data.escrowTotal);
          if (data.escrowFunded) setEscrowFunded(data.escrowFunded);
          if (data.escrowReleased) setEscrowReleased(data.escrowReleased);
          if (data.milestones) setMilestones(data.milestones);
          if (data.documents) setDocuments(data.documents);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProject();

    // 2. Setup message listener
    const msgsQuery = query(
      collection(db, "projects", projectId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMessages(list);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    });

    return () => unsubscribe();
  }, [projectId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !project) return;

    try {
      const msgData = {
        senderId: user.uid,
        senderName: user.displayName || user.email?.split("@")[0] || "User",
        text: inputText,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "projects", projectId, "messages"), msgData);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleEscrowDeposit = async () => {
    if (!user || !project) return;
    const remainingToFund = escrowTotal - escrowFunded;
    if (remainingToFund <= 0) return;
    
    // Client deposits ₹50,000 or remaining
    const depositAmount = Math.min(50000, remainingToFund);
    const newFunded = escrowFunded + depositAmount;

    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, {
        escrowFunded: newFunded
      });
      setEscrowFunded(newFunded);

      // Log notification
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System Audit Ledger",
        text: `💰 Client deposited ₹${depositAmount.toLocaleString()} into escrow wallet.`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscrowRelease = async () => {
    if (!user || !project) return;
    const availableToRelease = escrowFunded - escrowReleased;
    if (availableToRelease <= 0) return;

    const releaseAmount = Math.min(50000, availableToRelease);
    const newReleased = escrowReleased + releaseAmount;

    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, {
        escrowReleased: newReleased
      });
      setEscrowReleased(newReleased);

      // Log notification
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System Audit Ledger",
        text: `🔓 Client released ₹${releaseAmount.toLocaleString()} from escrow directly to the professional.`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMilestoneStatusChange = async (milestoneId: number, nextStatus: string) => {
    const updated = milestones.map((m) => {
      if (m.id === milestoneId) {
        return { 
          ...m, 
          status: nextStatus,
          date: nextStatus === "Verified Complete" ? new Date().toISOString().split("T")[0] : "In Progress"
        };
      }
      return m;
    });

    try {
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { milestones: updated });
      setMilestones(updated);

      // System notification
      const milestoneName = milestones.find(m => m.id === milestoneId)?.title || "Milestone";
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System Audit Ledger",
        text: `📍 Milestone "${milestoneName}" marked as [${nextStatus}]`,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingFile(true);
    try {
      const storageRef = ref(storage, `workspaces/${projectId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newDoc = {
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploadedBy: user.displayName || user.email?.split("@")[0] || "User",
        date: new Date().toISOString().split("T")[0],
        url
      };

      const updatedDocs = [...documents, newDoc];
      const docRef = doc(db, "projects", projectId);
      await updateDoc(docRef, { documents: updatedDocs });
      setDocuments(updatedDocs);

      // Chat log
      await addDoc(collection(db, "projects", projectId, "messages"), {
        senderId: "system",
        senderName: "System Audit Ledger",
        text: `📁 New document uploaded to vault: "${file.name}"`,
        createdAt: new Date().toISOString()
      });

    } catch (err) {
      console.error("Failed to upload document:", err);
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-955 text-white justify-center items-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">Syncing Collaborative Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-white">
        <Navbar />
        <main className="flex-grow flex flex-col justify-center items-center p-8 max-w-md mx-auto text-center pt-32">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
          <h2 className="text-2xl font-black tracking-tight">Workspace Restricted</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            You do not have credentials to enter this project workspace room, or it has been archived.
          </p>
          <Link href="/dashboard" className="mt-6 bg-white text-slate-950 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wide">
            Back to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isClient = user?.uid === project.clientId;
  const isBusiness = user?.uid === project.businessId;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-5 pt-28 pb-20">
        
        {/* Project workspace header */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {project.title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Active Project
              </span>
            </div>
            <div className="flex gap-4 text-xs font-bold text-slate-400">
              <span>Client: <strong className="text-slate-300">{project.clientName}</strong></span>
              <span>Professional: <strong className="text-slate-300">{project.businessName}</strong></span>
            </div>
          </div>

          <div className="flex gap-3 text-xs font-bold flex-wrap">
            <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl">
              <span className="block text-[9px] uppercase text-slate-500">Target Budget</span>
              <span className="text-sm font-black text-white">{project.budgetRange}</span>
            </div>
            <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl">
              <span className="block text-[9px] uppercase text-slate-500">Timeline Estimate</span>
              <span className="text-sm font-black text-white">{project.timelineEstimate}</span>
            </div>
          </div>
        </div>

        {/* Dynamic 3-Column Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COL 1: Milestones & Escrow Ledger (5 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* ESCROW LEDGER WALLET */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-400" /> Simulated Escrow Ledger
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-850 text-center">
                  <span className="text-[14px] font-black text-white">₹{escrowTotal.toLocaleString()}</span>
                  <span className="text-[8px] uppercase text-slate-500 block mt-1 font-bold">Total Budget</span>
                </div>
                <div className="bg-slate-955/50 p-3 rounded-xl border border-slate-850 text-center">
                  <span className="text-[14px] font-black text-indigo-400">₹{escrowFunded.toLocaleString()}</span>
                  <span className="text-[8px] uppercase text-slate-500 block mt-1 font-bold">Funded in Escrow</span>
                </div>
                <div className="bg-slate-955/50 p-3 rounded-xl border border-slate-850 text-center">
                  <span className="text-[14px] font-black text-emerald-450">₹{escrowReleased.toLocaleString()}</span>
                  <span className="text-[8px] uppercase text-slate-500 block mt-1 font-bold">Released to Pro</span>
                </div>
              </div>

              {/* Escrow simulated controls */}
              {isClient && (
                <div className="flex gap-2 pt-2 text-[10px] font-bold uppercase tracking-wider">
                  <button
                    disabled={escrowFunded >= escrowTotal}
                    onClick={handleEscrowDeposit}
                    className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 py-3 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-40"
                  >
                    Deposit ₹50k
                  </button>
                  <button
                    disabled={escrowReleased >= escrowFunded}
                    onClick={handleEscrowRelease}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition cursor-pointer disabled:opacity-40"
                  >
                    Release ₹50k
                  </button>
                </div>
              )}
            </div>

            {/* MILESTONE CHECKLIST */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Timeline Milestones</h3>
              
              <div className="space-y-4">
                {milestones.map((m) => (
                  <div key={m.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-xs text-white block">{m.title}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">Weight: {m.weight}% · Status: <strong className="text-slate-400">{m.status}</strong></span>
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        m.status === "Verified Complete" ? "bg-emerald-500/10 text-emerald-400" :
                        m.status === "Awaiting Verification" ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                        m.status === "In Progress" ? "bg-blue-500/10 text-blue-400" :
                        "bg-slate-800 text-slate-500"
                      }`}>
                        {m.status}
                      </span>
                    </div>

                    {/* Completion actions */}
                    {isBusiness && m.status === "In Progress" && (
                      <button
                        onClick={() => handleMilestoneStatusChange(m.id, "Awaiting Verification")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider block"
                      >
                        Submit For Client Review
                      </button>
                    )}

                    {isClient && m.status === "Awaiting Verification" && (
                      <button
                        onClick={() => handleMilestoneStatusChange(m.id, "Verified Complete")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg transition uppercase tracking-wider block animate-bounce"
                      >
                        Approve & Verify Milestone
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COL 2: Document Vault (3 Cols) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5 flex flex-col h-full justify-between">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Document Vault</h3>
                  <label className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[10px] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                  </label>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-2 text-[11px] font-semibold hover:border-slate-800 transition">
                      <div className="min-w-0">
                        <span className="text-slate-200 block truncate">{doc.name}</span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">{doc.size} · {doc.uploadedBy}</span>
                      </div>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white shrink-0 p-1">
                          <FileDown className="w-4 h-4" />
                        </a>
                      ) : (
                        <div className="text-slate-500 shrink-0 p-1">
                          <FileText className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {uploadingFile && (
                <div className="pt-4 text-center text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                  Uploading document...
                </div>
              )}
            </div>
          </div>

          {/* COL 3: Chat Thread / Discussion Workspace (4 Cols) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-lg">
              
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase text-slate-350 tracking-wider">Workspace Chat Feed</span>
                <span className="text-[10px] text-slate-500 font-bold">Client + Contractor</span>
              </div>

              {/* Message List */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-950/20">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 font-bold text-[11px] space-y-1">
                    <Send className="w-8 h-8 opacity-25 mx-auto mb-2 text-slate-60" />
                    <p>No messages posted yet.</p>
                    <p className="text-[9.5px] text-slate-600 font-semibold max-w-xs mx-auto leading-relaxed">Exchange daily standups, photos, and change requests in real-time.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSystem = msg.senderId === "system";
                    const isSelf = msg.senderId === user?.uid;
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center py-2">
                          <span className="inline-block bg-slate-850/80 border border-slate-800 text-slate-400 text-[9px] font-bold px-3 py-1.5 rounded-full leading-normal">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-slate-500 font-bold mb-0.5 px-1">{msg.senderName}</span>
                        <div className={`max-w-[85%] p-3 rounded-xl text-xs font-semibold leading-relaxed shadow-sm ${
                          isSelf
                            ? "bg-white text-slate-950 rounded-tr-none"
                            : "bg-slate-850 border border-slate-800 text-slate-200 rounded-tl-none"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-850 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Post message brief to workspace..."
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="bg-white hover:bg-slate-100 text-slate-950 w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
