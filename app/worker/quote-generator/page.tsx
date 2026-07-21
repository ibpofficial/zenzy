"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import {
  FileText,
  Plus,
  Trash2,
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  DollarSign,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  Sparkles,
  Printer,
  ShieldCheck
} from "lucide-react";

interface LineItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  gst: number;
}

export default function StandaloneQuoteGeneratorPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  // Inquiries / Clients list for quick fill
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // Client Details
  const [selectedInquiryId, setSelectedInquiryId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Quote Details
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState("50% Advance, 50% On Completion");
  const [termsAndConditions, setTermsAndConditions] = useState(
    "1. Quotation valid for 15 days from issue date.\n2. 50% advance payment required to schedule project start.\n3. Any additional work beyond stated scope will be billed separately."
  );

  // Dynamic Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "item-1", name: "Initial Diagnostics & Site Inspection", qty: 1, unit: "Job", rate: 500, gst: 18 },
    { id: "item-2", name: "Labor & Standard Installation", qty: 1, unit: "Job", rate: 1500, gst: 18 }
  ]);

  // Financial Summary Inputs
  const [discount, setDiscount] = useState("0");

  // Output / Saved State
  const [savingQuote, setSavingQuote] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch professional's client inquiries for 1-click select
  useEffect(() => {
    if (!user?.uid) return;
    const currentUid = user.uid;
    async function fetchInquiries() {
      try {
        setLoadingInquiries(true);
        const qEnq = query(collection(db, "professionalEnquiries"), where("workerId", "==", currentUid));
        const snap = await getDocs(qEnq);
        const list: any[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setInquiries(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInquiries(false);
      }
    }
    fetchInquiries();
  }, [user?.uid]);

  // Auto fill client when inquiry is selected
  const handleSelectInquiry = (inquiryId: string) => {
    setSelectedInquiryId(inquiryId);
    if (!inquiryId) return;
    const found = inquiries.find((i) => i.id === inquiryId);
    if (found) {
      setCustomerName(found.customerName || found.clientName || "");
      setCustomerPhone(found.contactPhone || found.customerPhone || "");
      setCustomerEmail(found.customerEmail || "");
      setCustomerAddress(found.projectLocation || "");
      setProjectTitle(found.projectTitle || "Custom Project Estimate");
      setProjectDescription(found.projectScope || "");
    }
  };

  // Line Item actions
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      name: "",
      qty: 1,
      unit: "Units",
      rate: 0,
      gst: 18
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Compute totals
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.rate || 0)), 0);
  const taxAmount = lineItems.reduce((sum, item) => {
    const rowSub = Number(item.qty || 1) * Number(item.rate || 0);
    const gstRate = Number(item.gst || 0) / 100;
    return sum + (rowSub * gstRate);
  }, 0);
  const discountVal = Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal + taxAmount);

  // Save Quotation to Firestore
  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!customerName.trim()) {
      alert("Please enter the Client Name.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    setSavingQuote(true);
    try {
      const quotePayload = {
        workerId: user.uid,
        workerName: userData?.name || "Professional",
        workerPhone: userData?.phone || "",
        workerAddress: userData?.address || userData?.serviceArea || "",
        quoteNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        projectTitle: projectTitle.trim() || "Technical Service Estimate",
        projectDescription: projectDescription.trim(),
        issueDate,
        expiryDate,
        paymentTerms,
        termsAndConditions,
        items: lineItems,
        subtotal,
        discount: discountVal,
        taxAmount,
        grandTotal,
        status: "Pending",
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "quotations"), quotePayload);
      setCreatedQuoteId(docRef.id);
      alert("✓ Quotation generated successfully!");
    } catch (err) {
      console.error("Save Quote Error:", err);
      alert("Failed to save quotation. Please try again.");
    } finally {
      setSavingQuote(false);
    }
  };

  if (authLoading) return <LoadingScreen autoDismiss={false} />;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pt-28">
          <FileText className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Professional Login Required</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-2">
            Please log in to your professional account to access the Quote Generator tool.
          </p>
          <Link href="/auth/login" className="mt-6 bg-[#1a3a5c] text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider">
            Sign In Now
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const publicQuoteUrl = createdQuoteId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/quote/${createdQuoteId}`
    : "";

  const whatsappShareText = createdQuoteId
    ? `Hello ${customerName},\n\nHere is your official Quotation #${quoteNumber} for "${projectTitle}" from ${userData?.name || "Zenzy Pro"}:\n\nGrand Total: ₹${grandTotal.toLocaleString("en-IN")}\n\nView full details & accept online:\n${publicQuoteUrl}`
    : "";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Minimal Top Header with Back Button */}
      <div className="bg-slate-900 text-white py-3.5 px-6 border-b border-slate-800 shadow-md flex items-center justify-between sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/worker/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <span className="text-slate-500 font-normal text-xs">|</span>
          <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
            Zenzy <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md">Quote Composer</span>
          </span>
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 pt-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <Link href="/worker/dashboard" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1a3a5c] hover:underline mb-1">
              <ChevronLeft className="w-4 h-4" /> Return to Dashboard
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#1a3a5c]" />
              Professional Quote Generator
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Draft itemized project estimates, calculate taxes, and share direct public quote links with clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Composer
            </span>
          </div>
        </div>

        {/* Main Composer Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8">
          
          <form onSubmit={handleSaveQuotation} className="space-y-8">
            
            {/* Quick Fill from Recent Inquiries */}
            {inquiries.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  ⚡ Quick Fill from Client Inquiries
                </label>
                <select
                  value={selectedInquiryId}
                  onChange={(e) => handleSelectInquiry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                >
                  <option value="">-- Select Client Inquiry to Pre-fill --</option>
                  {inquiries.map((inq) => (
                    <option key={inq.id} value={inq.id}>
                      {inq.customerName} - {inq.projectTitle} ({inq.projectBudget || "Custom"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Section 1: Client & Project Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                1. Client & Project Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Client Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. +91 98290 12345"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Project Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. Full Duplex Electrical Rewiring & Fitting"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Site Location / Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="e.g. Vaishali Nagar, Jaipur"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Quote Metadata */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                2. Quotation Terms & Dates
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Quote Reference #</label>
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Valid Until Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Payment Terms Schedule</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                >
                  <option value="50% Advance, 50% On Completion">50% Advance, 50% On Completion</option>
                  <option value="100% Payment On Project Handover">100% Payment On Project Handover</option>
                  <option value="30% Advance, 40% Mid-work, 30% Handover">30% Advance, 40% Mid-work, 30% Handover</option>
                  <option value="Custom Negotiated Milestones">Custom Negotiated Milestones</option>
                </select>
              </div>
            </div>

            {/* Section 3: Dynamic Itemized Scope Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  3. Line Items & Rate Breakdown
                </h3>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="bg-[#1a3a5c]/10 hover:bg-[#1a3a5c]/20 text-[#1a3a5c] text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 border border-[#1a3a5c]/20"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1a3a5c]" /> Add Item Row
                </button>
              </div>

              <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-black">
                        <th className="p-3">Item Description / Work Scope</th>
                        <th className="p-3 w-20 text-center">Qty</th>
                        <th className="p-3 w-28">Unit</th>
                        <th className="p-3 w-28 text-right">Rate (₹)</th>
                        <th className="p-3 w-24 text-right">GST %</th>
                        <th className="p-3 w-32 text-right">Total (₹)</th>
                        <th className="p-3 w-12 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {lineItems.map((item) => {
                        const rowTotal = (Number(item.qty) || 1) * (Number(item.rate) || 0);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition">
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateLineItem(item.id, "name", e.target.value)}
                                placeholder="e.g. Sub-main wiring & Distribution Box setup"
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) => handleUpdateLineItem(item.id, "qty", Number(e.target.value))}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-extrabold text-center text-slate-900 outline-none focus:border-[#1a3a5c]"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={item.unit}
                                onChange={(e) => handleUpdateLineItem(item.id, "unit", e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                              >
                                <option value="Units">Units</option>
                                <option value="Sq Ft">Sq Ft</option>
                                <option value="Hours">Hours</option>
                                <option value="Days">Days</option>
                                <option value="Job">Job</option>
                                <option value="Items">Items</option>
                              </select>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={0}
                                value={item.rate}
                                onChange={(e) => handleUpdateLineItem(item.id, "rate", Number(e.target.value))}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-right text-slate-900 outline-none focus:border-[#1a3a5c]"
                              />
                            </td>
                            <td className="p-2.5">
                              <select
                                value={item.gst}
                                onChange={(e) => handleUpdateLineItem(item.id, "gst", Number(e.target.value))}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-[#1a3a5c]"
                              >
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                              </select>
                            </td>
                            <td className="p-2.5 text-right font-black text-slate-900">
                              ₹{rowTotal.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLineItem(item.id)}
                                className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer font-bold"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 4: Summary & Final Computation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Terms & Instructions to Client
                  </label>
                  <textarea
                    rows={4}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-normal text-slate-700 outline-none resize-none focus:border-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-extrabold text-white text-sm">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-300">Special Discount (₹):</span>
                    <input
                      type="number"
                      min={0}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="w-28 px-3 py-1 bg-slate-800 border border-slate-700 text-right text-emerald-400 font-extrabold rounded-lg outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Estimated Tax (GST):</span>
                    <span className="font-bold text-white">+ ₹{taxAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-300">Grand Total:</span>
                    <span className="text-2xl font-black text-emerald-400">₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3.5 rounded-2xl tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingQuote ? "Saving Quote..." : "Save & Generate Shareable Link"}</span>
                </button>
              </div>

            </div>

          </form>

          {/* Share & Distribution Section (Shown after generating) */}
          {createdQuoteId && (
            <div className="bg-emerald-50 border border-emerald-200/80 p-6 rounded-3xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900">Quotation Ready for Client Delivery!</h4>
                  <p className="text-xs text-slate-600 font-semibold mt-0.5">
                    Share the public quotation page link directly with {customerName} on WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={publicQuoteUrl}
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 select-all"
                />

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicQuoteUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 3000);
                  }}
                  className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
                </button>

                <a
                  href={`https://wa.me/${customerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappShareText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share on WhatsApp</span>
                </a>

                <Link
                  href={`/quote/${createdQuoteId}`}
                  target="_blank"
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>View Quote ↗</span>
                </Link>
              </div>
            </div>
          )}

        </div>

      </main>

      <Footer />
    </div>
  );
}
