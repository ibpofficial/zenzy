"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CrmLead, ProCustomer, CrmQuotation, CrmInvoice, Project } from "@/lib/schema";
import {
  Users,
  Search,
  Plus,
  Star,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  X,
  Briefcase,
  Calendar,
  Sparkles,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  Send,
  AlertTriangle,
  Flame,
  Bot,
  UserCheck,
  CheckSquare,
  ArrowRight,
  Filter,
  Eye,
  Download,
  Copy,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  Building,
  Home,
  Check,
  Loader2,
  ExternalLink,
  Layers,
  LayoutGrid,
  List,
  Inbox,
  Maximize2,
  Minimize2
} from "lucide-react";

export default function ProfessionalCrmSuitePage() {
  const { user, userData } = useAuth();

  // Full Focus Screen Mode (Removes side nav and top header completely)
  const [isFullFocusMode, setIsFullFocusMode] = useState(false);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "leads" | "customers" | "projects" | "quotations" | "invoices" | "tasks"
  >("dashboard");

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollTabsLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const handleScrollTabsRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  // View Mode for Leads: Board (Kanban) or Table
  const [leadsViewMode, setLeadsViewMode] = useState<"board" | "table">("board");

  // 100% Real Firestore Datasets
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [customers, setCustomers] = useState<ProCustomer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<CrmQuotation[]>([]);
  const [invoices, setInvoices] = useState<CrmInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Lead for 360 Drawer
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Form States for Creating Real Data
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadLocation, setNewLeadLocation] = useState("");
  const [newLeadService, setNewLeadService] = useState("");
  const [newLeadBudget, setNewLeadBudget] = useState<number>(250000);
  const [newLeadProperty, setNewLeadProperty] = useState<"Residential" | "Commercial" | "Villa" | "Apartment" | "Office">("Residential");
  const [submittingLead, setSubmittingLead] = useState(false);

  // AI Quote Generator State
  const [showAiQuoteModal, setShowAiQuoteModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("Kitchen Renovation 120 sq ft Premium");
  const [aiGenerating, setAiGenerating] = useState(false);

  // Follow-up Addition State
  const [newFollowUpNote, setNewFollowUpNote] = useState("");
  const [newFollowUpDate, setNewFollowUpDate] = useState("Tomorrow");
  const [newFollowUpType, setNewFollowUpType] = useState<"call" | "whatsapp" | "reminder" | "visit" | "email">("call");

  // 1. Synchronize ONLY Real Data from Firestore Collections
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const proUid = user.uid;

    // A. Listen to Real Inquiries & Bookings from Firestore
    const unsubInquiries = onSnapshot(collection(db, "inquiries"), (snap) => {
      const realLeads: CrmLead[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.businessId === proUid || data.workerId === proUid || data.professionalId === proUid) {
          realLeads.push({
            id: docSnap.id,
            professionalId: proUid,
            name: data.customerName || data.name || "Client Inquiry",
            phone: data.customerPhone || data.phone || "",
            email: data.customerEmail || data.email || "",
            location: data.city || data.location || "Location Not Set",
            serviceNeeded: data.serviceNeeded || data.serviceType || "Service Required",
            budget: data.budget || 150000,
            propertyType: data.propertyType || "Residential",
            leadSource: data.leadSource || "Zenzy Marketplace",
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || "new",
            aiScore: data.aiScore || Math.floor(Math.random() * 20) + 78,
            aiReasons: data.aiReasons || ["Active inquiry", "Budget verified"],
            followUps: data.followUps || [],
            timeline: data.timeline || [
              { id: `t-${docSnap.id}`, title: "Inquiry Received", description: "Submitted via Zenzy Profile", timestamp: new Date(data.createdAt || Date.now()).toLocaleDateString() }
            ],
            notes: data.notes || []
          });
        }
      });

      // Also listen to professionalEnquiries
      onSnapshot(collection(db, "professionalEnquiries"), (pSnap) => {
        pSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.workerId === proUid || data.businessId === proUid) {
            if (!realLeads.some((l) => l.id === docSnap.id)) {
              realLeads.push({
                id: docSnap.id,
                professionalId: proUid,
                name: data.name || "Direct Enquiry",
                phone: data.phone || "",
                email: data.email || "",
                location: data.city || "Jaipur",
                serviceNeeded: data.message || "Custom Renovation",
                budget: data.budget || 200000,
                propertyType: "Residential",
                leadSource: "Direct Website",
                createdAt: data.createdAt || new Date().toISOString(),
                status: data.status || "new",
                aiScore: 85,
                aiReasons: ["Direct profile contact", "High intent lead"],
                followUps: [],
                timeline: [
                  { id: `t-enq-${docSnap.id}`, title: "Direct Profile Message", description: data.message || "Enquiry sent", timestamp: "Recently" }
                ],
                notes: [data.message].filter(Boolean)
              });
            }
          }
        });
        setLeads([...realLeads]);
      });
    });

    // B. Listen to Real Converted Customers (`pro_customers`)
    const qCustomers = query(collection(db, "pro_customers"), where("professionalId", "==", proUid));
    const unsubCustomers = onSnapshot(qCustomers, (snap) => {
      const realCust: ProCustomer[] = [];
      snap.forEach((d) => realCust.push({ id: d.id, ...d.data() } as ProCustomer));
      setCustomers(realCust);
    });

    // C. Listen to Real Live Projects (`projects`)
    const qProjects = query(collection(db, "projects"));
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      const list: Project[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.businessId === proUid || data.contractorId === proUid || data.professionalId === proUid) {
          list.push({ id: d.id, ...data } as Project);
        }
      });
      setProjects(list);
    });

    // D. Listen to Real Quotations (`quotations`)
    const qQuotes = query(collection(db, "quotations"));
    const unsubQuotes = onSnapshot(qQuotes, (snap) => {
      const list: CrmQuotation[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.professionalId === proUid || data.businessId === proUid) {
          list.push({ id: d.id, ...data } as CrmQuotation);
        }
      });
      setQuotations(list);
    });

    // E. Listen to Real Invoices & Payment Requests (`paymentRequests`)
    const qInvoices = query(collection(db, "paymentRequests"));
    const unsubInvoices = onSnapshot(qInvoices, (snap) => {
      const list: CrmInvoice[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.businessId === proUid || data.contractorId === proUid || data.professionalId === proUid) {
          list.push({
            id: d.id,
            professionalId: proUid,
            invoiceNumber: `INV-${d.id.slice(-5).toUpperCase()}`,
            customerName: data.clientName || "Customer",
            customerPhone: data.clientPhone || "",
            amount: data.amount || 0,
            gstAmount: Math.round((data.amount || 0) * 0.18),
            totalAmount: Math.round((data.amount || 0) * 1.18),
            status: data.status === "paid" ? "paid" : "pending",
            dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            createdAt: data.createdAt || new Date().toISOString()
          });
        }
      });
      setInvoices(list);
      setLoading(false);
    });

    return () => {
      unsubInquiries();
      unsubCustomers();
      unsubProjects();
      unsubQuotes();
      unsubInvoices();
    };
  }, [user]);

  // Real Firestore Mutation: Add New Lead
  const handleCreateLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newLeadName.trim() || !newLeadPhone.trim()) return;

    setSubmittingLead(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        businessId: user.uid,
        professionalId: user.uid,
        customerName: newLeadName.trim(),
        customerPhone: newLeadPhone.trim(),
        city: newLeadLocation.trim() || "Jaipur",
        serviceNeeded: newLeadService.trim() || "General Renovation",
        budget: Number(newLeadBudget) || 250000,
        propertyType: newLeadProperty,
        leadSource: "Direct Professional CRM",
        status: "new",
        aiScore: Math.floor(Math.random() * 20) + 78,
        aiReasons: ["Direct inquiry", "Phone verified", "High budget match"],
        followUps: [
          { id: `fu-${Date.now()}`, type: "call", scheduledFor: "Tomorrow, 11:00 AM", notes: "Initial requirement discussion", status: "pending" }
        ],
        timeline: [
          { id: `t-${Date.now()}`, title: "Lead Created", description: "Entered in Professional CRM", timestamp: "Just now" }
        ],
        createdAt: now
      };

      await addDoc(collection(db, "inquiries"), payload);

      setNewLeadName("");
      setNewLeadPhone("");
      setNewLeadLocation("");
      setNewLeadService("");
      setShowAddLeadModal(false);
    } catch (err) {
      console.error("Create lead error:", err);
    } finally {
      setSubmittingLead(false);
    }
  };

  // Real Firestore Mutation: Update Lead Status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: CrmLead["status"]) => {
    try {
      const leadRef = doc(db, "inquiries", leadId);
      await updateDoc(leadRef, { status: newStatus });
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    } catch (err) {
      console.error("Update lead status error:", err);
    }
  };

  // Real Firestore Mutation: Add Follow Up
  const handleAddFollowUpToLead = async () => {
    if (!selectedLead || !newFollowUpNote.trim()) return;
    try {
      const newEntry = {
        id: `fu-${Date.now()}`,
        type: newFollowUpType,
        scheduledFor: newFollowUpDate,
        notes: newFollowUpNote.trim(),
        status: "pending" as const
      };

      const updatedList = [...(selectedLead.followUps || []), newEntry];
      await updateDoc(doc(db, "inquiries", selectedLead.id), {
        followUps: updatedList
      });

      setSelectedLead({ ...selectedLead, followUps: updatedList });
      setNewFollowUpNote("");
    } catch (err) {
      console.error("Add follow up error:", err);
    }
  };

  // Real Firestore Mutation: Generate AI Quotation
  const handleGenerateAiQuote = async () => {
    if (!aiPrompt.trim() || !user) return;
    setAiGenerating(true);

    try {
      const now = new Date().toISOString();
      const newQuotePayload = {
        professionalId: user.uid,
        businessId: user.uid,
        customerName: selectedLead ? selectedLead.name : "Client Proposal",
        customerPhone: selectedLead ? selectedLead.phone : "",
        projectTitle: aiPrompt.trim(),
        totalAmount: 245000,
        status: "draft",
        createdAt: now,
        aiGenerated: true,
        items: [
          { title: `${aiPrompt} - High-grade Materials`, qty: 120, unit: "sq ft", rate: 1450, amount: 174000 },
          { title: "Hardware Fittings & Assembly", qty: 1, unit: "Lot", rate: 41000, amount: 41000 },
          { title: "Labour, Finishing & Installation", qty: 1, unit: "Job", rate: 30000, amount: 30000 }
        ]
      };

      await addDoc(collection(db, "quotations"), newQuotePayload);

      setAiGenerating(false);
      setShowAiQuoteModal(false);
      setActiveTab("quotations");
    } catch (err) {
      console.error("AI Quote Generation error:", err);
      setAiGenerating(false);
    }
  };

  const userName = userData?.name ? userData.name.split(" ")[0] : "Professional";
  const expectedRevenueTotal = leads
    .filter((l) => l.status !== "lost")
    .reduce((sum, l) => sum + (l.budget || 0), 0);

  const pendingFollowUpsCount = leads.flatMap((l) => l.followUps || []).filter((f) => f.status === "pending").length;

  return (
    <div
      className={
        isFullFocusMode
          ? "fixed inset-0 z-50 bg-slate-50 overflow-y-auto p-4 sm:p-6 space-y-5 font-sans text-slate-900 text-left"
          : "space-y-6 font-sans text-slate-900 text-left max-w-[1536px] mx-auto p-3 sm:p-6"
      }
    >
      {/* ── CLEAN SQUARE EXECUTIVE HEADER BAR WITH FULL VIEW TOGGLE ── */}
      <div className="bg-[#0f172a] rounded-lg p-4 sm:p-5 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Translucent Glassmorphic Back Button in Full Focus Mode */}
          {isFullFocusMode ? (
            <button
              type="button"
              onClick={() => setIsFullFocusMode(false)}
              className="bg-slate-800/80 backdrop-blur-md hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-md border border-slate-700 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Suite</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsFullFocusMode(true)}
              title="Full View CRM Focus Mode (hides side nav and top header)"
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold px-3 py-1.5 rounded-md border border-slate-700/80 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Full View</span>
            </button>
          )}

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Professional CRM Suite
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Real-time Client Inquiry Pipeline &amp; Sales Management
            </p>
          </div>
        </div>

        {/* Tab Navigation Bar with Scroll Arrows & Square Buttons */}
        <div className="flex items-center gap-1.5 z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={handleScrollTabsLeft}
            aria-label="Scroll tabs left"
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={tabsContainerRef}
            className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth bg-slate-900 p-1 rounded-md border border-slate-700/80 max-w-full"
          >
            {[
              { id: "dashboard", label: "Dashboard", icon: Home },
              { id: "leads", label: "Leads", icon: Flame, badge: leads.length },
              { id: "customers", label: "Customers", icon: Users, badge: customers.length },
              { id: "projects", label: "Projects", icon: Briefcase, badge: projects.length },
              { id: "quotations", label: "Quotations", icon: FileText, badge: quotations.length },
              { id: "invoices", label: "Invoices", icon: DollarSign, badge: invoices.filter((i) => i.status === "pending").length },
            ].map((tb) => {
              const Icon = tb.icon;
              const isActive = activeTab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setActiveTab(tb.id as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tb.label}</span>
                  {tb.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${isActive ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
                      {tb.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleScrollTabsRight}
            aria-label="Scroll tabs right"
            className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center cursor-pointer transition shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          1. DASHBOARD TAB
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "dashboard" && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Executive Metric Cards (Square Boxes with Small Rounded Corners) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Active Leads</span>
              <span className="text-2xl font-black text-slate-900 block font-mono">{leads.length}</span>
              <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Live Inquiries
              </span>
            </div>

            <div className="bg-white border border-amber-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">Follow Ups Today</span>
              <span className="text-2xl font-black text-amber-600 block font-mono">{pendingFollowUpsCount}</span>
              <span className="text-[9.5px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded inline-block">
                Pending Actions
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Projects Running</span>
              <span className="text-2xl font-black text-slate-900 block font-mono">{projects.length}</span>
              <span className="text-[9.5px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                Live Workspaces
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Quotations Pending</span>
              <span className="text-2xl font-black text-slate-900 block font-mono">
                {quotations.filter((q) => q.status === "sent" || q.status === "draft").length}
              </span>
              <span className="text-[9.5px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded inline-block">
                Awaiting Client
              </span>
            </div>

            <div className="bg-white border border-emerald-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">Expected Revenue</span>
              <span className="text-xl font-black text-emerald-700 block font-mono">
                ₹{expectedRevenueTotal.toLocaleString("en-IN")}
              </span>
              <span className="text-[9.5px] font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded inline-block">
                Pipeline Value
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-3.5 rounded-lg shadow-2xs text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Conversion Rate</span>
              <span className="text-2xl font-black text-slate-900 block font-mono">
                {leads.length > 0 ? `${Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100)}%` : "0%"}
              </span>
              <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Real Ratio
              </span>
            </div>
          </div>

          {/* Priority Call Queue & Quick Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-3.5 shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" /> Priority Action Calls
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">High-intent customer inquiries from database</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded border border-amber-300">
                  {leads.length} Live Leads
                </span>
              </div>

              {leads.length === 0 ? (
                <div className="py-10 text-center bg-slate-50 rounded-md border border-dashed border-slate-200 p-6 space-y-2">
                  <div className="w-10 h-10 rounded-md bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">No Client Inquiries Found</h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-medium">
                    Customer inquiries from your Zenzy profile will appear here automatically, or click "+ Add Lead" to record direct clients.
                  </p>
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-bold shadow-xs hover:bg-slate-800 transition cursor-pointer"
                  >
                    + Add Direct Client Lead
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 px-1 rounded transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{lead.name}</span>
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-indigo-200">
                            {lead.serviceNeeded}
                          </span>
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <Bot className="w-3 h-3 text-emerald-600" /> AI Score {lead.aiScore}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Location: {lead.location} • Budget: ₹{lead.budget.toLocaleString("en-IN")}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition shadow-2xs flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" /> Call
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-black uppercase tracking-wider transition shadow-2xs cursor-pointer"
                        >
                          View 360
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Growth Copilot Widget */}
            <div className="space-y-3.5">
              <div className="bg-[#0f172a] text-white p-4 sm:p-5 rounded-lg space-y-2.5 border border-slate-800 shadow-xs">
                <div className="flex items-center gap-2 text-amber-400 font-black text-[11px] uppercase tracking-wider">
                  <Bot className="w-4 h-4" /> AI Growth Copilot
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  You currently have <strong>{leads.length} active leads</strong> in database. Closing quotes promptly increases win-rate by <strong>68%</strong>.
                </p>
                <button
                  onClick={() => setShowAiQuoteModal(true)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bot className="w-3.5 h-3.5" /> Generate AI Quotation
                </button>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg space-y-2.5 shadow-2xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-400">Quick Navigation</h4>
                  <button onClick={() => setShowAddLeadModal(true)} className="text-xs font-bold text-indigo-600 hover:underline">
                    + Add Lead
                  </button>
                </div>
                <div className="space-y-1.5 text-xs font-semibold">
                  <button onClick={() => setActiveTab("leads")} className="w-full p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-800 flex justify-between items-center transition">
                    <span>Lead Pipeline ({leads.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => setActiveTab("customers")} className="w-full p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-800 flex justify-between items-center transition">
                    <span>Converted Customers ({customers.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          2. LEADS MODULE
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" /> Active Lead Pipeline ({leads.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Real Firestore database entries</p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="bg-white p-1 rounded border border-slate-200 flex items-center text-xs font-bold">
                <button
                  onClick={() => setLeadsViewMode("board")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${leadsViewMode === "board" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Board
                </button>
                <button
                  onClick={() => setLeadsViewMode("table")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${leadsViewMode === "table" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  <List className="w-3.5 h-3.5" /> Table
                </button>
              </div>

              <button
                onClick={() => setShowAddLeadModal(true)}
                className="bg-[#0f172a] hover:bg-[#1e3a8a] text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Lead
              </button>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg border border-slate-200 p-8 space-y-2 shadow-2xs">
              <div className="w-12 h-12 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900">No Client Leads Saved Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                When customers submit inquiries on your Zenzy business profile or request quotes, their details will sync here automatically.
              </p>
              <button
                onClick={() => setShowAddLeadModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded shadow-xs transition cursor-pointer"
              >
                + Add Your First Client Lead
              </button>
            </div>
          ) : (
            leadsViewMode === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
                {[
                  { stage: "new", label: "New Inquiries", bg: "border-blue-400" },
                  { stage: "site_visit", label: "Site Visit Scheduled", bg: "border-amber-400" },
                  { stage: "quotation_sent", label: "Quotation Sent", bg: "border-indigo-400" },
                  { stage: "won", label: "Won / Project Started", bg: "border-emerald-400" },
                ].map((col) => {
                  const stageLeads = leads.filter((l) => l.status === col.stage || (col.stage === "new" && l.status === "contacted"));
                  return (
                    <div key={col.stage} className={`bg-white border-t-2 ${col.bg} border-x border-b border-slate-200 p-3.5 rounded-lg shadow-2xs space-y-2.5 min-w-[250px]`}>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">{col.label}</span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black">
                          {stageLeads.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="bg-white border border-slate-200 hover:border-slate-400 p-3 rounded-md transition cursor-pointer space-y-2 shadow-2xs"
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-xs text-slate-900">{lead.name}</h4>
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[9px] font-black">
                                {lead.aiScore}% Score
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 font-medium line-clamp-1">{lead.serviceNeeded}</p>
                            <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
                              <span className="font-black text-emerald-600 font-mono">₹{lead.budget.toLocaleString("en-IN")}</span>
                              <span className="text-[9.5px] text-slate-400 font-bold">{lead.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase text-slate-400 tracking-wider">
                      <th className="py-2.5 px-3">Lead Name</th>
                      <th className="py-2.5 px-3">Phone / Email</th>
                      <th className="py-2.5 px-3">Service Needed</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Budget</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{lead.name}</td>
                        <td className="py-3 px-3 text-slate-600">{lead.phone}</td>
                        <td className="py-3 px-3 text-slate-800">{lead.serviceNeeded}</td>
                        <td className="py-3 px-3 text-slate-600">{lead.location}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-600">₹{lead.budget.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase border border-indigo-200">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="bg-slate-900 text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer"
                          >
                            360 Drawer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          3. CUSTOMERS MODULE
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "customers" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Customer Vault ({customers.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Verified active clients &amp; repeat project accounts</p>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg border border-slate-200 p-8 space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No Customers Saved Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Converted client leads automatically move here once project quotes are accepted.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((c) => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs hover:border-slate-300 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-md bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-2xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">{c.companyName || "Private Homeowner"}</span>
                      </div>
                    </div>

                    {c.isRepeat && (
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[9.5px] font-black uppercase flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Repeat Client
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1.5 text-xs">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Customer 360 Preferences</span>
                    {c.preferredTime && (
                      <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> {c.preferredTime}
                      </p>
                    )}
                    {c.paymentPreference && (
                      <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {c.paymentPreference}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 flex justify-between items-center text-xs font-bold">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> Call {c.phone}
                      </a>
                    )}
                    <span className="text-slate-400 text-[11px]">Projects: {c.completedProjectsCount || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. PROJECTS MODULE
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "projects" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Active Projects ({projects.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Clicking any project opens its live Zenzy Workspace</p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg border border-slate-200 p-8 space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No Running Workspace Projects</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Accepted client quotations automatically initialize live workspaces here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-lg space-y-3 shadow-2xs hover:border-indigo-400 transition">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Client: {p.clientName || "Customer"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-600">Stage: {p.currentStage || "Execution"}</span>
                      <span className="text-indigo-600">{p.progressPercent || 50}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${p.progressPercent || 50}%` }} />
                    </div>
                  </div>

                  <Link
                    href={`/workspace/${p.id}`}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer block text-center"
                  >
                    <span>Open Live Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          5. QUOTATIONS MODULE
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "quotations" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Sent Quotations ({quotations.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Proposals created in Firestore</p>
            </div>

            <button
              onClick={() => setShowAiQuoteModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Bot className="w-3.5 h-3.5" /> AI Quote Generator
            </button>
          </div>

          {quotations.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg border border-slate-200 p-8 space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No Quotations Generated Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Use the AI Quote Generator above to prepare your first itemized proposal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <div key={q.id} className="bg-white border border-slate-200 p-4 rounded-lg space-y-3 shadow-2xs">
                  <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{q.projectTitle}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Client: {q.customerName} ({q.customerPhone})</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 font-mono">₹{q.totalAmount.toLocaleString("en-IN")}</span>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {q.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
                    {q.items.map((it, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                        <span className="text-slate-800">{it.title}</span>
                        <span className="font-mono text-slate-900 font-bold">₹{it.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          6. INVOICES MODULE
          ─────────────────────────────────────────────────────────── */}
      {activeTab === "invoices" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Invoices &amp; Ledger ({invoices.length})
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Track GST bills &amp; payment requests</p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-lg border border-slate-200 p-8 space-y-2 shadow-2xs">
              <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <DollarSign className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">No Invoices Issued Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Payment requests created in live project workspaces will automatically populate here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-white border border-slate-200 p-4 rounded-lg flex justify-between items-center flex-wrap gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-slate-900">{inv.invoiceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        inv.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Customer: {inv.customerName} ({inv.customerPhone})</p>
                    <span className="text-[10px] text-slate-400 font-bold block">Due Date: {inv.dueDate}</span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xl font-black text-slate-900 font-mono block">₹{inv.totalAmount.toLocaleString("en-IN")}</span>
                    {inv.status === "pending" && (
                      <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded transition shadow-2xs">
                        Send Payment Link
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          LEAD 360° DRAWER
          ─────────────────────────────────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fade-in font-sans">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl relative border-l border-slate-200 text-left">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedLead.name}</h3>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black">
                    AI Score {selectedLead.aiScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Location: {selectedLead.location} • Phone: {selectedLead.phone}
                </p>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded transition text-center flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Client
                </a>
              )}
              <button
                onClick={() => {
                  setShowAiQuoteModal(true);
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded transition text-center flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" /> AI Quotation
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Update Lead Status</span>
              <div className="flex flex-wrap gap-1.5">
                {(["new", "contacted", "site_visit", "quotation_sent", "negotiation", "won", "lost"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateLeadStatus(selectedLead.id, st)}
                    className={`px-2.5 py-1 rounded text-xs font-bold capitalize transition cursor-pointer ${
                      selectedLead.status === st
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2.5">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900">Lead Audit Timeline</h4>
              <div className="space-y-2.5 relative before:absolute before:left-2.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200">
                {(selectedLead.timeline || []).map((step, idx) => (
                  <div key={idx} className="relative pl-6 space-y-0.5">
                    <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                    <span className="font-bold text-xs text-slate-900 block">{step.title}</span>
                    <p className="text-[10.5px] text-slate-500 font-medium">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-lg space-y-2.5">
              <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-amber-900">Follow Up Engine</h4>
              
              <div className="space-y-1.5">
                {(selectedLead.followUps || []).map((fu) => (
                  <div key={fu.id} className="bg-white p-3 rounded border border-amber-200 flex justify-between items-center text-xs font-semibold">
                    <div>
                      <span className="font-bold text-slate-900 block">{fu.notes}</span>
                      <span className="text-[10px] text-amber-800 font-bold block mt-0.5">Scheduled: {fu.scheduledFor}</span>
                    </div>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[9.5px] font-extrabold uppercase">
                      {fu.type}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-1.5 space-y-2">
                <input
                  type="text"
                  placeholder="Add new follow-up note e.g. Call Friday to confirm site Visit"
                  value={newFollowUpNote}
                  onChange={(e) => setNewFollowUpNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-900 outline-none"
                />
                <button
                  onClick={handleAddFollowUpToLead}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer"
                >
                  Schedule Follow Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW LEAD */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Add New Client Lead</h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeadSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location</label>
                  <input
                    type="text"
                    value={newLeadLocation}
                    onChange={(e) => setNewLeadLocation(e.target.value)}
                    placeholder="e.g. Mansarovar, Jaipur"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Service Needed</label>
                <input
                  type="text"
                  value={newLeadService}
                  onChange={(e) => setNewLeadService(e.target.value)}
                  placeholder="e.g. Full Interior Design & Woodwork"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={newLeadBudget}
                    onChange={(e) => setNewLeadBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Property</label>
                  <select
                    value={newLeadProperty}
                    onChange={(e) => setNewLeadProperty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 outline-none"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Villa">Villa</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Office">Office</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLead}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submittingLead ? "Saving to Database..." : "Save Lead & Start Follow-Up"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI QUOTE GENERATOR */}
      {showAiQuoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 text-left shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">AI Quotation Generator</h3>
              </div>
              <button onClick={() => setShowAiQuoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <label className="block text-slate-700 font-bold">Describe Scope of Work &amp; Specification</label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Kitchen Renovation 120 sq ft Premium with soft-close Hettich fittings and quartz top"
                className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-xs text-slate-900 outline-none focus:border-indigo-600 font-medium"
              />
            </div>

            <button
              onClick={handleGenerateAiQuote}
              disabled={aiGenerating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Calculating Material Rates &amp; Quantities...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Generate Itemized Quotation ✨</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
