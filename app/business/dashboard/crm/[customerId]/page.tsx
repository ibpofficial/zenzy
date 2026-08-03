"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ProCustomer,
  ProCustomerNote,
  ProCustomerFollowup,
  Project,
  Quotation,
  Invoice,
  ProVaultDocument
} from "@/lib/schema";
import {
  addProCustomerNote,
  addProCustomerFollowup,
  updateProCustomer,
  uploadVaultDocument
} from "@/lib/proSuite";
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  Building,
  MapPin,
  Star,
  RefreshCw,
  Clock,
  Plus,
  Briefcase,
  FileText,
  DollarSign,
  FileCode,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Send,
  Check
} from "lucide-react";

export default function ProCustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const customerId = params?.customerId as string;

  const [customer, setCustomer] = useState<ProCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  // Aggregated Collections State
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<ProCustomerNote[]>([]);
  const [followups, setFollowups] = useState<ProCustomerFollowup[]>([]);
  const [documents, setDocuments] = useState<ProVaultDocument[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "timeline" | "projects" | "quotes" | "invoices" | "notes" | "documents" | "followups"
  >("timeline");

  // Form Inputs
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const [followupDate, setFollowupDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [addingFollowup, setAddingFollowup] = useState(false);

  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState<ProVaultDocument["category"]>("contract");
  const [addingDoc, setAddingDoc] = useState(false);

  // 1. Fetch Customer Document
  useEffect(() => {
    if (!customerId) return;
    const unsub = onSnapshot(doc(db, "pro_customers", customerId), (d) => {
      if (d.exists()) {
        setCustomer({ id: d.id, ...d.data() } as ProCustomer);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [customerId]);

  // 2. Aggregate Projects, Quotes, Invoices, Notes, Followups, Documents
  useEffect(() => {
    if (!user || !customerId || !customer) return;

    // Projects
    const qProjects = query(
      collection(db, "projects"),
      where("businessId", "==", user.uid)
    );
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => {
        const data = d.data() as Project;
        if (
          data.clientId === customerId ||
          (customer.email && data.clientName?.toLowerCase() === customer.name.toLowerCase())
        ) {
          list.push({ ...data, id: d.id });
        }
      });
      setProjects(list);
    });

    // Quotes
    const qQuotes = query(
      collection(db, "quotations"),
      where("businessId", "==", user.uid)
    );
    const unsubQuotes = onSnapshot(qQuotes, (snap) => {
      const list: Quotation[] = [];
      snap.forEach((d) => {
        const data = d.data() as Quotation;
        if (
          data.customerId === customerId ||
          (customer.email && data.customerEmail?.toLowerCase() === customer.email.toLowerCase()) ||
          data.customerName?.toLowerCase() === customer.name.toLowerCase()
        ) {
          list.push({ ...data, id: d.id });
        }
      });
      setQuotes(list);
    });

    // Invoices
    const qInvoices = query(
      collection(db, "invoices"),
      where("workerId", "==", user.uid)
    );
    const unsubInvoices = onSnapshot(qInvoices, (snap) => {
      const list: Invoice[] = [];
      snap.forEach((d) => {
        const data = d.data() as Invoice;
        if (
          (customer.email && data.customerEmail?.toLowerCase() === customer.email.toLowerCase()) ||
          data.customerName?.toLowerCase() === customer.name.toLowerCase()
        ) {
          list.push({ ...data, id: d.id });
        }
      });
      setInvoices(list);
    });

    // Customer Notes
    const qNotes = query(
      collection(db, "pro_customer_notes"),
      where("customerId", "==", customerId)
    );
    const unsubNotes = onSnapshot(qNotes, (snap) => {
      const list: ProCustomerNote[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProCustomerNote));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotes(list);
    });

    // Customer Followups
    const qFollowups = query(
      collection(db, "pro_customer_followups"),
      where("customerId", "==", customerId)
    );
    const unsubFollowups = onSnapshot(qFollowups, (snap) => {
      const list: ProCustomerFollowup[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProCustomerFollowup));
      list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setFollowups(list);
    });

    // Customer Documents
    const qDocs = query(
      collection(db, "pro_vault_documents"),
      where("customerId", "==", customerId)
    );
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      const list: ProVaultDocument[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProVaultDocument));
      setDocuments(list);
    });

    return () => {
      unsubProjects();
      unsubQuotes();
      unsubInvoices();
      unsubNotes();
      unsubFollowups();
      unsubDocs();
    };
  }, [user, customerId, customer]);

  // Derived Chronological Timeline Feed
  const timelineEvents = [
    ...projects.map((p) => ({
      id: `proj_${p.id}`,
      type: "project",
      title: `Project: ${p.title}`,
      subtitle: `Status: ${p.status}`,
      date: p.createdAt,
      icon: Briefcase,
      color: "text-blue-600 bg-blue-50"
    })),
    ...quotes.map((q) => ({
      id: `quote_${q.id}`,
      type: "quote",
      title: `Quotation Sent (${q.quoteNumber || "Quote"})`,
      subtitle: `Amount: ₹${q.grandTotal?.toLocaleString() || "0"} · Status: ${q.status}`,
      date: q.createdAt,
      icon: FileText,
      color: "text-amber-600 bg-amber-50"
    })),
    ...invoices.map((i) => ({
      id: `inv_${i.id}`,
      type: "invoice",
      title: `Invoice Issued (${i.invoiceNumber})`,
      subtitle: `Amount: ₹${i.grandTotal?.toLocaleString() || "0"} · Status: ${i.status}`,
      date: i.createdAt,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50"
    })),
    ...notes.map((n) => ({
      id: `note_${n.id}`,
      type: "note",
      title: `Note by ${n.authorName}`,
      subtitle: n.note,
      date: n.createdAt,
      icon: Users,
      color: "text-purple-600 bg-purple-50"
    }))
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  // Action Handlers
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newNoteText.trim()) return;
    setAddingNote(true);
    try {
      await addProCustomerNote({
        customerId,
        professionalId: user.uid,
        authorName: userData?.name || "Professional",
        note: newNoteText.trim()
      });
      setNewNoteText("");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !followupDate || !followupNote.trim()) return;
    setAddingFollowup(true);
    try {
      await addProCustomerFollowup({
        customerId,
        customerName: customer?.name,
        professionalId: user.uid,
        dueDate: followupDate,
        note: followupNote.trim(),
        status: "pending"
      });
      setFollowupDate("");
      setFollowupNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingFollowup(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !docName.trim() || !docUrl.trim()) return;
    setAddingDoc(true);
    try {
      await uploadVaultDocument({
        professionalId: user.uid,
        customerId,
        customerName: customer?.name,
        category: docCategory,
        name: docName.trim(),
        fileUrl: docUrl.trim(),
        fileType: "pdf",
        tags: ["client_attached"]
      });
      setDocName("");
      setDocUrl("");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingDoc(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400 text-xs">Loading customer 360 view...</div>;
  }

  if (!customer) {
    return (
      <div className="py-16 text-center space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Customer Not Found</h3>
        <Link href="/business/dashboard/crm" className="text-xs text-blue-600 font-semibold hover:underline">
          Return to Customer CRM
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/business/dashboard/crm"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await updateProCustomer(customer.id, { isFavourite: !customer.isFavourite });
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              customer.isFavourite
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${customer.isFavourite ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>{customer.isFavourite ? "Starred" : "Star Client"}</span>
          </button>
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{customer.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] ${
                customer.status === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {customer.status}
            </span>
            {(customer.isRepeat || projects.length >= 2) && (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Repeat Client
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
            {customer.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>{customer.email}</span>
              </div>
            )}
            {customer.companyName && (
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>{customer.companyName}</span>
              </div>
            )}
            {customer.city && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{customer.city}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 shrink-0">
          <div className="text-center px-3 border-r border-slate-700">
            <div className="text-xs text-slate-400">Projects</div>
            <div className="text-base font-bold text-white">{projects.length}</div>
          </div>
          <div className="text-center px-3 border-r border-slate-700">
            <div className="text-xs text-slate-400">Quotes</div>
            <div className="text-base font-bold text-white">{quotes.length}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-slate-400">Invoices</div>
            <div className="text-base font-bold text-white">{invoices.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "timeline", label: "Timeline", count: timelineEvents.length },
          { id: "projects", label: "Projects", count: projects.length },
          { id: "quotes", label: "Quotes", count: quotes.length },
          { id: "invoices", label: "Invoices", count: invoices.length },
          { id: "notes", label: "Notes", count: notes.length },
          { id: "documents", label: "Documents", count: documents.length },
          { id: "followups", label: "Follow-ups", count: followups.length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* 1. Timeline Tab */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Activity Timeline</h3>
          {timelineEvents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No timeline events logged yet for this customer.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timelineEvents.map((ev) => {
                const Icon = ev.icon;
                return (
                  <div key={ev.id} className="relative flex items-start gap-4">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center -ml-8 ring-4 ring-white ${ev.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{ev.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(ev.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{ev.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No active or completed projects linked to this customer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {projects.map((p) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">{p.title}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Quotes Tab */}
      {activeTab === "quotes" && (
        <div className="space-y-3">
          {quotes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No quotations sent to this customer.
            </div>
          ) : (
            <div className="space-y-2">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{q.quoteNumber || "Quote"}</span>
                    <p className="text-slate-500 text-[11px]">{q.projectTitle || "Service Quote"}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{q.grandTotal?.toLocaleString() || "0"}</div>
                    <span className="text-[10px] uppercase font-bold text-amber-600">{q.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
              No invoices created for this customer.
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map((i) => (
                <div
                  key={i.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{i.invoiceNumber}</span>
                    <p className="text-slate-500 text-[11px]">{i.projectTitle}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">₹{i.grandTotal?.toLocaleString() || "0"}</div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600">{i.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              required
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a timestamped private note about this customer..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={addingNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{addingNote ? "Adding..." : "Add Note"}</span>
            </button>
          </form>

          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-slate-700">{n.authorName}</span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-800">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Documents Tab */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              type="text"
              required
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Document Name (e.g. Approved Contract)"
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
            <input
              type="url"
              required
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              placeholder="File URL / Link"
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
            <select
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value="contract">Contract</option>
              <option value="drawing">Drawing / Blueprint</option>
              <option value="bill">GST Bill</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
            <button
              type="submit"
              disabled={addingDoc}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {addingDoc ? "Attaching..." : "Attach Document"}
            </button>
          </form>

          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">{d.name}</span>
                  <span className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                    {d.category}
                  </span>
                </div>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                  View File
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Follow-ups Tab */}
      {activeTab === "followups" && (
        <div className="space-y-4">
          <form onSubmit={handleAddFollowup} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <input
              type="date"
              required
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
            <input
              type="text"
              required
              value={followupNote}
              onChange={(e) => setFollowupNote(e.target.value)}
              placeholder="Reminder note (e.g. Call for site inspection confirmation)"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
            <button
              type="submit"
              disabled={addingFollowup}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {addingFollowup ? "Scheduling..." : "Schedule Follow-up"}
            </button>
          </form>

          <div className="space-y-2">
            {followups.map((f) => (
              <div key={f.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">{f.note}</div>
                  <div className="text-[11px] text-slate-400">Due Date: {f.dueDate}</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold uppercase text-[10px]">
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
