"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ProVaultDocument } from "@/lib/schema";
import { uploadVaultDocument } from "@/lib/proSuite";
import {
  FolderArchive,
  Search,
  Plus,
  Paperclip,
  Calendar,
  AlertTriangle,
  Tag,
  X,
  FileText,
  ExternalLink,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  FileCheck
} from "lucide-react";

export default function ProVaultPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ProVaultDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);

  // Creation State
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [category, setCategory] = useState<ProVaultDocument["category"]>("gst");
  const [tagInput, setTagInput] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Sync Documents
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "pro_vault_documents"),
      where("professionalId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ProVaultDocument[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProVaultDocument));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setDocuments(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !fileUrl.trim()) return;

    setSubmitting(true);
    try {
      const tags = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await uploadVaultDocument({
        professionalId: user.uid,
        name: name.trim(),
        fileUrl: fileUrl.trim(),
        fileType: "pdf",
        category,
        tags,
        expiryDate: expiryDate || undefined
      });

      setModalOpen(false);
      setName("");
      setFileUrl("");
      setTagInput("");
      setExpiryDate("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeStyle = (cat: string) => {
    switch (cat) {
      case "gst": return "bg-blue-50 text-blue-700 border-blue-200";
      case "pan": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "aadhaar": return "bg-sky-50 text-sky-700 border-sky-200";
      case "contract": return "bg-purple-50 text-purple-700 border-purple-200";
      case "bill": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "drawing": return "bg-amber-50 text-amber-700 border-amber-200";
      case "insurance": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Executive Compliance Vault
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-[4px]">
              256-bit Encrypted
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#0f2744]" />
            <span>Document Vault & Tax Repository</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold max-w-2xl leading-relaxed">
            Secure, centralized cloud storage for GST registrations, PAN cards, Aadhaar proofs, insurance policies, site blueprints & legal agreements.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-[6px] bg-[#0f2744] hover:bg-[#1e3a8a] text-white text-xs font-black uppercase tracking-wider shadow-subtle transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Executive Vault Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Total Vault Records</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900">{documents.length}</span>
            <FileCheck className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Tax & GST Files</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {documents.filter((d) => d.category === "gst" || d.category === "pan" || d.category === "bill").length}
            </span>
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Contracts & Drawings</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-indigo-700">
              {documents.filter((d) => d.category === "contract" || d.category === "drawing").length}
            </span>
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-[8px] shadow-subtle space-y-1">
          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Expiring Alerts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-600">
              {documents.filter((d) => d.expiryDate).length}
            </span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Search & Executive Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-[8px] border border-slate-200/90 shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault files by title, category, or tag (e.g. GST, PAN, 2026)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/60 rounded-[6px] border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {["all", "gst", "pan", "aadhaar", "contract", "bill", "drawing", "insurance"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-[6px] font-black uppercase text-[10px] whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? "bg-[#0f2744] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-semibold">
          Synchronizing secure cloud vault...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[8px] border border-slate-200/90 p-8 shadow-subtle space-y-3">
          <div className="w-14 h-14 rounded-[8px] bg-slate-100 text-[#0f2744] flex items-center justify-center mx-auto border border-slate-200">
            <FolderArchive className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">No Vault Documents Found</h3>
          <p className="text-xs text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
            Store essential business licenses, tax IDs, blueprints, and client agreements safely in your executive vault.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-4 py-2 rounded-[6px] font-black text-xs uppercase tracking-wider transition shadow-subtle mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Vault File</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-5 rounded-[8px] border border-slate-200/90 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="font-extrabold text-slate-900 text-xs truncate">{doc.name}</h3>
                  </div>
                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-[4px] border shrink-0 ${getCategoryBadgeStyle(doc.category)}`}>
                    {doc.category}
                  </span>
                </div>

                {doc.expiryDate && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-[4px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Expires: {doc.expiryDate}</span>
                  </div>
                )}

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {doc.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-[4px]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                  {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3 py-1.5 rounded-[6px] text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-subtle"
                >
                  <span>View File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Executive Upload Vault Document */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[10px] max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-blue-600" />
                <span>Upload Executive Vault Document</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GST Registration Certificate 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">File URL / Cloud Link *</label>
                <input
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-xs font-semibold bg-white"
                  >
                    <option value="gst">GST Registration</option>
                    <option value="pan">PAN Card</option>
                    <option value="aadhaar">Aadhaar Proof</option>
                    <option value="contract">Client Contract</option>
                    <option value="bill">GST Tax Bill</option>
                    <option value="drawing">Drawing / Blueprint</option>
                    <option value="insurance">Insurance Policy</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="legal, compliance, 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-[6px] text-xs font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] text-xs font-extrabold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-[6px] bg-[#0f2744] hover:bg-[#1e3a8a] text-white text-xs font-black uppercase tracking-wider shadow-subtle cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save to Vault"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
