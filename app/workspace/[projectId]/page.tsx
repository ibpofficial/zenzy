"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import WorkspaceAiAssistant from "@/components/WorkspaceAiAssistant";
import { logProjectEvent } from "@/lib/projectEvents";
import { recalculateProjectTrust } from "@/lib/projectTrust";
import { generateProjectAlerts, ProjectAlert } from "@/lib/projectAlerts";
import { triggerNotification } from "@/lib/notifications";
import { compressImageToBase64, uploadProjectMediaImage } from "@/lib/imageUtils";
import {
  canStartMilestone,
  canRequestMilestoneCompletion,
  canReleasePayment,
  canCompleteProject
} from "@/lib/workflowEngine";
import {
  Project,
  ProjectEvent,
  Milestone,
  DailyLog,
  ProjectMedia,
  ProjectDocument,
  MaterialEntry,
  ProjectTeamMember,
  PaymentRequest,
  ProjectWarranty,
  WorkspaceMessage,
  BusinessProfile,
  ProjectDecision,
  ProjectIssue,
  ProjectChangeRequest
} from "@/lib/schema";
import ProjectHubHeader from "./components/ProjectHubHeader";
import ActivityTimelineFeed from "./components/ActivityTimelineFeed";
import DecisionCenterModal from "./components/DecisionCenterModal";
import IssuesAndChangesTab from "./components/IssuesAndChangesTab";
import StageGalleryView from "./components/StageGalleryView";
import ProjectHealthCard from "./components/ProjectHealthCard";
import CompletionRecordCard from "./components/CompletionRecordCard";
import ProjectNotificationsDrawer from "./components/ProjectNotificationsDrawer";
import {
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  IndianRupee,
  Camera,
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
  Upload,
  Layers,
  Wrench,
  Users,
  Award,
  ImageIcon,
  ShieldCheck,
  Sparkles,
  Maximize2,
  X,
  Check,
  ShieldAlert,
  Mic,
  Pin,
  MessageSquare,
  Plus,
  User
} from "lucide-react";

export default function WorkspacePage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId || routeParams?.id) as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Core Data States (Real-time Firestore)
  const [project, setProject] = useState<Project | null>(null);
  const [proProfile, setProProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Section Tab (Project Hub Control Center)
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "stages"
    | "logs"
    | "decisions"
    | "issues"
    | "gallery"
    | "financials"
    | "documents"
    | "materials"
    | "team"
    | "completion"
    | "communication"
  >("overview");
  const [selectedStageId, setSelectedStageId] = useState<string>("all");

  // Sub-collection States (Real-time Firestore Listeners)
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [mediaList, setMediaList] = useState<ProjectMedia[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [materials, setMaterials] = useState<MaterialEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [warranty, setWarranty] = useState<ProjectWarranty | null>(null);
  const [chatMessages, setChatMessages] = useState<WorkspaceMessage[]>([]);
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProjectChangeRequest[]>([]);
  const [showProjectNotifDrawer, setShowProjectNotifDrawer] = useState(false);
  const [projectNotifications, setProjectNotifications] = useState<any[]>([]);

  // Interactive Form / Action States
  const [chatText, setChatText] = useState("");
  const [voiceNoteUrl, setVoiceNoteUrl] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [isMeetingNote, setIsMeetingNote] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<ProjectMedia | null>(null);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectingMilestoneId, setRejectingMilestoneId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Daily Log Form State (For Contractor)
  const [logWorkers, setLogWorkers] = useState(2);
  const [logHours, setLogHours] = useState(8);
  const [logSummaryBullets, setLogSummaryBullets] = useState<string[]>(["Executed site rough-in & plaster work"]);
  const [newBulletText, setNewBulletText] = useState("");
  const [logIssues, setLogIssues] = useState("");
  const [logTomorrow, setLogTomorrow] = useState("");
  const [logOverallPercent, setLogOverallPercent] = useState<number>(0);
  const [logMediaFile, setLogMediaFile] = useState<File | null>(null);

  // Document Upload Form State
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<ProjectDocument["type"]>("blueprint");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Custom Milestone & Task Form States
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newMilestoneCost, setNewMilestoneCost] = useState<string>("");
  const [newMilestoneDeadline, setNewMilestoneDeadline] = useState("");

  const [addTaskMilestoneId, setAddTaskMilestoneId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Stage Intelligence & Completion Wizard States
  const [activeStageSubTab, setActiveStageSubTab] = useState<"overview" | "chat" | "documents" | "media" | "logs" | "issues" | "notes">("overview");
  const [activeDocSubCategory, setActiveDocSubCategory] = useState<string>("all");
  const [showCompletionWizardModal, setShowCompletionWizardModal] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState("");
  const [newIssuePriority, setNewIssuePriority] = useState<"low" | "medium" | "high">("medium");
  const [newNoteText, setNewNoteText] = useState("");

  // 1. Fetch & Listen to Main Project Doc (with Inquiry Fallback)
  useEffect(() => {
    const targetId = (routeParams?.projectId || routeParams?.id) as string;
    if (!targetId) return;

    let unsub: () => void = () => {};

    async function initProject() {
      try {
        const pRef = doc(db, "projects", targetId);
        const pSnap = await getDoc(pRef);

        let activeDocId = targetId;

        if (!pSnap.exists()) {
          // Check if targetId is an inquiryId with a spawned project
          const q = query(collection(db, "projects"), where("inquiryId", "==", targetId));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            activeDocId = qSnap.docs[0].id;
          } else {
            // Check if targetId is an inquiry itself and construct a fallback project
            const inqRef = doc(db, "inquiries", targetId);
            const inqSnap = await getDoc(inqRef);
            if (inqSnap.exists()) {
              const inqData = inqSnap.data();
              const fallback: Project = {
                id: targetId,
                clientId: inqData.clientId || "",
                clientName: inqData.clientName || "Client",
                businessId: inqData.businessId || inqData.professionalId || "",
                businessName: "Professional Partner",
                title: inqData.title || "Project Workspace",
                description: inqData.requirements || "",
                category: "Construction & Renovation",
                status: "active",
                budgetRange: inqData.budgetRange || "₹50,000 - ₹2,000,000",
                timelineEstimate: inqData.timelineEstimate || "2-4 Weeks",
                createdAt: inqData.createdAt || new Date().toISOString(),
                inquiryId: targetId,
                progressPercent: 0
              };
              setProject(fallback);
              setLoading(false);
              return;
            }
          }
        }

        unsub = onSnapshot(
          doc(db, "projects", activeDocId),
          async (snap) => {
            if (snap.exists()) {
              const pData = { id: snap.id, ...snap.data() } as Project;
              setProject(pData);
              setLogOverallPercent(pData.progressPercent || 0);

              if (pData.businessId) {
                try {
                  const bDoc = await getDoc(doc(db, "workers", pData.businessId));
                  if (bDoc.exists()) {
                    setProProfile({ uid: bDoc.id, ...bDoc.data() } as BusinessProfile);
                  }
                } catch (err) {
                  console.error("Error fetching pro profile:", err);
                }
              }
            } else {
              setProject(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Error subscribing to project:", err);
            setLoading(false);
          }
        );
      } catch (err) {
        console.error("Error initializing project subscription:", err);
        setLoading(false);
      }
    }

    initProject();

    return () => unsub();
  }, [routeParams]);

  // 2. Real-time Subscriptions for Event Timeline & All Sub-collections
  useEffect(() => {
    if (!projectId) return;

    // Timeline Events
    const qEvents = query(collection(db, "projects", projectId, "events"), orderBy("createdAt", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      const list: ProjectEvent[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectEvent));
      setEvents(list);
    });

    // Milestones
    const qMilestones = query(collection(db, "milestones"), where("projectId", "==", projectId));
    const unsubMilestones = onSnapshot(qMilestones, (snap) => {
      const list: Milestone[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Milestone));
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setMilestones(list);
    });

    // Daily Logs
    const qLogs = query(collection(db, "dailyLogs"), where("projectId", "==", projectId));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const list: DailyLog[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as DailyLog));
      list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      setDailyLogs(list);
    });

    // Project Media
    const qMedia = query(collection(db, "projectMedia"), where("projectId", "==", projectId));
    const unsubMedia = onSnapshot(qMedia, (snap) => {
      const list: ProjectMedia[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectMedia));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMediaList(list);
    });

    // Documents
    const qDocs = query(collection(db, "projectDocuments"), where("projectId", "==", projectId));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      const list: ProjectDocument[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectDocument));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDocuments(list);
    });

    // Materials
    const qMaterials = query(collection(db, "materialEntries"), where("projectId", "==", projectId));
    const unsubMaterials = onSnapshot(qMaterials, (snap) => {
      const list: MaterialEntry[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MaterialEntry));
      list.sort((a, b) => new Date(b.purchasedAt || 0).getTime() - new Date(a.purchasedAt || 0).getTime());
      setMaterials(list);
    });

    // Team Members
    const qTeam = query(collection(db, "projectTeam"), where("projectId", "==", projectId));
    const unsubTeam = onSnapshot(qTeam, (snap) => {
      const list: ProjectTeamMember[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectTeamMember));
      setTeamMembers(list);
    });

    // Payment Requests
    const qPayments = query(collection(db, "paymentRequests"), where("projectId", "==", projectId));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const list: PaymentRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PaymentRequest));
      list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setPaymentRequests(list);
    });

    // Warranties
    const qWarranty = query(collection(db, "warranties"), where("projectId", "==", projectId));
    const unsubWarranty = onSnapshot(qWarranty, (snap) => {
      if (!snap.empty) {
        setWarranty({ id: snap.docs[0].id, ...snap.docs[0].data() } as ProjectWarranty);
      } else {
        setWarranty(null);
      }
    });

    // Messages
    const qMsgs = query(collection(db, "projects", projectId, "messages"), orderBy("createdAt", "asc"));
    const unsubMsgs = onSnapshot(qMsgs, (snap) => {
      const list: WorkspaceMessage[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as WorkspaceMessage));
      setChatMessages(list);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    });

    // Decisions
    const qDecisions = query(collection(db, "projects", projectId, "decisions"), orderBy("createdAt", "desc"));
    const unsubDecisions = onSnapshot(qDecisions, (snap) => {
      const list: ProjectDecision[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectDecision));
      setDecisions(list);
    });

    // Issues
    const qIssues = query(collection(db, "projects", projectId, "issues"), orderBy("createdAt", "desc"));
    const unsubIssues = onSnapshot(qIssues, (snap) => {
      const list: ProjectIssue[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectIssue));
      setIssues(list);
    });

    // Change Requests
    const qCR = query(collection(db, "projects", projectId, "changeRequests"), orderBy("createdAt", "desc"));
    const unsubCR = onSnapshot(qCR, (snap) => {
      const list: ProjectChangeRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ProjectChangeRequest));
      setChangeRequests(list);
    });

    // Notifications for this user
    let unsubNotif = () => {};
    if (user?.uid) {
      const qNotif = query(collection(db, "notifications"), where("userId", "==", user.uid));
      unsubNotif = onSnapshot(qNotif, (snap) => {
        const list: any[] = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.projectId === projectId || (!data.projectId && data.text?.includes(projectId))) {
            list.push({ id: d.id, ...data });
          }
        });
        setProjectNotifications(list);
      });
    }

    return () => {
      unsubEvents();
      unsubMilestones();
      unsubLogs();
      unsubMedia();
      unsubDocs();
      unsubMaterials();
      unsubTeam();
      unsubPayments();
      unsubWarranty();
      unsubMsgs();
      unsubDecisions();
      unsubIssues();
      unsubCR();
      unsubNotif();
    };
  }, [projectId, user?.uid]);

  // ── ATOMIC CASCADES & ACTIONS ──

  // 1. Send Communication Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() && !voiceNoteUrl && !locationLabel) return;
    if (!user || !project) return;
    setSendingMsg(true);

    try {
      const now = new Date().toISOString();
      const isClient = user.uid === project.clientId;
      const actorRole = isClient ? "client" : "professional";
      const actorName = user.displayName || user.email?.split("@")[0] || (isClient ? "Client" : "Contractor");

      const msgData: Omit<WorkspaceMessage, "id"> = {
        projectId,
        senderId: user.uid,
        senderName: actorName,
        text: chatText.trim() || (voiceNoteUrl ? "🎵 Sent voice note" : "📍 Shared location"),
        createdAt: now
      };
      if (selectedStageId !== "all") msgData.milestoneId = selectedStageId;
      if (voiceNoteUrl.trim()) msgData.voiceNoteUrl = voiceNoteUrl.trim();
      if (locationLabel.trim()) msgData.location = { lat: 26.9124, lng: 75.7873, label: locationLabel.trim() };
      if (isMeetingNote) msgData.isMeetingNote = true;

      await addDoc(collection(db, "projects", projectId, "messages"), msgData);

      // Log Timeline Event
      await logProjectEvent(projectId, {
        projectId,
        type: "message_sent",
        title: isMeetingNote ? `Meeting Note Added by ${actorName}` : `Message from ${actorName}`,
        description: msgData.text.slice(0, 80),
        actorId: user.uid,
        actorName,
        actorRole,
        createdAt: now
      });

      setChatText("");
      setVoiceNoteUrl("");
      setLocationLabel("");
      setIsMeetingNote(false);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // 2. Contractor Requests Milestone Completion Inspection
  const handleRequestMilestoneInspection = async (m: Milestone) => {
    if (!user || !project) return;

    // Validate requirement checklist
    const check = canRequestMilestoneCompletion(m, milestones, dailyLogs, documents, mediaList);
    if (!check.allowed) {
      alert(`⚠️ Milestone Checklist Requirements Missing:\n\n${(check.missingRequirements || []).map((r) => `• ${r}`).join("\n")}`);
      return;
    }

    setActionProcessing(m.id);

    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || "Contractor";

      await updateDoc(doc(db, "milestones", m.id), {
        proApproved: true,
        proApprovedAt: now,
        completionRequestedAt: now,
        status: "in_progress"
      });

      // Log Event
      await logProjectEvent(projectId, {
        projectId,
        type: "milestone_completion_requested",
        title: `Milestone Inspection Requested: "${m.title}"`,
        description: `Contractor marked stage ready for client verification.`,
        actorId: user.uid,
        actorName,
        actorRole: "professional",
        relatedId: m.id,
        createdAt: now
      });

      if (project.clientId) {
        await triggerNotification(
          project.clientId,
          "Milestone Completion Requested",
          `${actorName} requested inspection for "${m.title}". Please review and verify.`,
          "booking"
        );
      }
    } catch (err) {
      console.error("Error requesting milestone inspection:", err);
    } finally {
      setActionProcessing(null);
    }
  };

  // 3. Client Approves Milestone (Milestone Approval Chain Cascade)
  const handleApproveMilestone = async (m: Milestone) => {
    if (!user || !project) return;
    if (!isClient) {
      alert("⛔ Customer Action Only:\n\nMilestone verification and approval must be performed from the customer's account.");
      return;
    }
    setActionProcessing(m.id);

    try {
      const now = new Date().toISOString();
      const isProDone = !!m.proApproved || !!m.completionRequestedAt;
      const newStatus = isProDone ? "completed" : "in_progress";
      const actorName = user.displayName || "Customer";

      // A. Update Milestone Doc
      await updateDoc(doc(db, "milestones", m.id), {
        clientApproved: true,
        clientApprovedAt: now,
        status: newStatus,
        approvedAt: now,
        approvedBy: user.uid
      });

      // B. Recalculate Overall Progress %
      const updatedList = milestones.map((item) => (item.id === m.id ? { ...item, status: newStatus, clientApproved: true } : item));
      const completedCount = updatedList.filter((item) => item.status === "completed").length;
      const newProgress = Math.round((completedCount / (updatedList.length || 1)) * 100);

      await updateDoc(doc(db, "projects", projectId), {
        progressPercent: newProgress,
        currentStage: m.title
      });

      // C. Auto-create Payment Request if milestone has cost
      if (m.cost && m.cost > 0) {
        await addDoc(collection(db, "paymentRequests"), {
          projectId,
          milestoneId: m.id,
          amount: m.cost,
          description: `Milestone Release Payment: "${m.title}"`,
          status: "pending",
          requestedBy: user.uid,
          requestedAt: now
        });
      }

      // D. Log Timeline Event
      await logProjectEvent(projectId, {
        projectId,
        type: "milestone_approved",
        title: `Milestone Verified & Signed Off: "${m.title}"`,
        description: `Customer verified completion. Overall progress reached ${newProgress}%.`,
        actorId: user.uid,
        actorName,
        actorRole: "client",
        relatedId: m.id,
        metadata: { milestoneTitle: m.title, newProgress },
        createdAt: now
      });

      if (project.businessId) {
        await triggerNotification(
          project.businessId,
          "Milestone Completion Verified!",
          `Customer verified milestone: "${m.title}". Overall progress is now ${newProgress}%.`,
          "booking"
        );
      }
    } catch (err) {
      console.error("Error approving milestone:", err);
    } finally {
      setActionProcessing(null);
    }
  };

  // 4. Client Rejects Milestone Inspection (With Reason)
  const handleRejectMilestone = async (m: Milestone) => {
    if (!user || !project || !rejectReason.trim()) return;
    if (!isClient) {
      alert("⛔ Customer Action Only:\n\nSubmitting milestone feedback and rework requests can only be done from the customer's account.");
      return;
    }
    setActionProcessing(m.id);

    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || "Customer";

      await updateDoc(doc(db, "milestones", m.id), {
        proApproved: false,
        completionRequestedAt: null,
        status: "in_progress",
        issues: rejectReason.trim()
      });

      await logProjectEvent(projectId, {
        projectId,
        type: "milestone_rejected",
        title: `Milestone Inspection Declined: "${m.title}"`,
        description: `Customer feedback: "${rejectReason.trim()}"`,
        actorId: user.uid,
        actorName,
        actorRole: "client",
        relatedId: m.id,
        metadata: { reason: rejectReason.trim() },
        createdAt: now
      });

      if (project.businessId) {
        await triggerNotification(
          project.businessId,
          "Milestone Feedback Received",
          `Customer requested changes on milestone "${m.title}": ${rejectReason.trim()}`,
          "booking"
        );
      }

      setRejectingMilestoneId(null);
      setRejectReason("");
    } catch (err) {
      console.error("Error rejecting milestone:", err);
    } finally {
      setActionProcessing(null);
    }
  };

  // Custom Milestone Creation Handler
  const handleCreateCustomMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !newMilestoneTitle.trim()) return;

    setActionProcessing("createMilestone");
    try {
      const now = new Date().toISOString();
      const nextOrder = milestones.length + 1;
      const costVal = newMilestoneCost ? parseFloat(newMilestoneCost) : 0;

      const newMilestoneData: Record<string, any> = {
        projectId,
        title: newMilestoneTitle.trim(),
        status: "pending",
        progressPercent: 0,
        order: nextOrder,
        proApproved: false,
        clientApproved: false,
        tasks: []
      };
      if (newMilestoneDesc.trim()) newMilestoneData.description = newMilestoneDesc.trim();
      if (costVal > 0) newMilestoneData.cost = costVal;
      if (newMilestoneDeadline?.trim()) newMilestoneData.deadline = newMilestoneDeadline.trim();

      const mRef = await addDoc(collection(db, "milestones"), newMilestoneData as Omit<Milestone, "id">);

      const actorName = user.displayName || user.email?.split("@")[0] || (user.uid === project.clientId ? "Customer" : "Contractor");
      const actorRole = user.uid === project.clientId ? "client" : "professional";

      await logProjectEvent(projectId, {
        projectId,
        type: "milestone_created",
        title: `Custom Milestone Added: "${newMilestoneTitle.trim()}"`,
        description: newMilestoneDesc.trim() || `Added by ${actorName}`,
        actorId: user.uid,
        actorName,
        actorRole,
        relatedId: mRef.id,
        createdAt: now
      });

      const recipientId = user.uid === project.clientId ? project.businessId : project.clientId;
      if (recipientId) {
        await triggerNotification(
          recipientId,
          "New Custom Milestone Added",
          `${actorName} added custom milestone: "${newMilestoneTitle.trim()}".`,
          "booking"
        );
      }

      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      setNewMilestoneCost("");
      setNewMilestoneDeadline("");
      setShowAddMilestoneModal(false);
    } catch (err) {
      console.error("Error creating custom milestone:", err);
      alert("Failed to create milestone.");
    } finally {
      setActionProcessing(null);
    }
  };

  // Add Custom Task to Milestone
  const handleAddTaskToMilestone = async (milestone: Milestone) => {
    if (!newTaskTitle.trim() || !user) return;

    try {
      const existingTasks = milestone.tasks || [];
      const newTask = {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false
      };

      const updatedTasks = [...existingTasks, newTask];

      await updateDoc(doc(db, "milestones", milestone.id), {
        tasks: updatedTasks
      });

      setNewTaskTitle("");
      setAddTaskMilestoneId(null);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  // Toggle Custom Task Completion
  const handleToggleTask = async (milestone: Milestone, taskId: string) => {
    if (!user) return;
    try {
      const existingTasks = milestone.tasks || [];
      const actorName = user.displayName || (user.uid === project?.clientId ? "Customer" : "Contractor");
      const now = new Date().toISOString();

      const updatedTasks = existingTasks.map((t) => {
        if (t.id === taskId) {
          const nextState = !t.completed;
          const taskObj: any = {
            ...t,
            completed: nextState,
          };
          if (nextState) {
            taskObj.completedBy = actorName;
            taskObj.completedAt = now;
          } else {
            delete taskObj.completedBy;
            delete taskObj.completedAt;
          }
          return taskObj;
        }
        return t;
      });

      await updateDoc(doc(db, "milestones", milestone.id), {
        tasks: updatedTasks
      });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  // Delete Custom Task
  const handleDeleteTask = async (milestone: Milestone, taskId: string) => {
    try {
      const updatedTasks = (milestone.tasks || []).filter((t) => t.id !== taskId);
      await updateDoc(doc(db, "milestones", milestone.id), {
        tasks: updatedTasks
      });
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  // Delete Custom Milestone (Protected once double-approved)
  const handleDeleteMilestone = async (mId: string) => {
    const target = milestones.find((m) => m.id === mId);
    if (target && ((target.proApproved && target.clientApproved) || target.status === "completed")) {
      alert(
        "🔒 Locked Milestone:\n\nThis stage has been verified and accepted by both customer and contractor. Once accepted on both sides, a milestone is permanently locked and cannot be deleted or removed."
      );
      return;
    }
    if (!confirm("Are you sure you want to delete this milestone stage?")) return;
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "milestones", mId));
    } catch (err) {
      console.error("Error deleting milestone:", err);
    }
  };

  // 5. Payment Chain Cascade (Payment Approved & Escrow Release)
  const handleRespondPaymentRequest = async (pReq: PaymentRequest, newStatus: "approved" | "rejected") => {
    if (!user || !project) return;

    if (newStatus === "approved" && pReq.milestoneId) {
      const linkedMilestone = milestones.find((m) => m.id === pReq.milestoneId);
      const check = canReleasePayment(pReq, linkedMilestone);
      if (!check.allowed) {
        alert(check.reason);
        return;
      }
    }

    setActionProcessing(pReq.id);

    try {
      const now = new Date().toISOString();
      const isClient = user.uid === project.clientId;
      const actorName = user.displayName || (isClient ? "Customer" : "Contractor");

      await updateDoc(doc(db, "paymentRequests", pReq.id), {
        status: newStatus,
        respondedAt: now
      });

      if (newStatus === "approved") {
        const newReleased = (project.escrowReleased || 0) + (pReq.amount || 0);
        const newTotalPaid = (project.totalPaid || 0) + (pReq.amount || 0);

        await updateDoc(doc(db, "projects", projectId), {
          escrowReleased: newReleased,
          totalPaid: newTotalPaid
        });

        // Auto-generate Payment Receipt Document
        await addDoc(collection(db, "projectDocuments"), {
          projectId,
          type: "receipt",
          name: `Payment_Receipt_₹${pReq.amount}_${pReq.description.slice(0, 15)}.pdf`,
          fileUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
          uploadedBy: user.uid,
          version: 1,
          status: "verified",
          verified: true,
          createdAt: now
        });

        // Log Timeline Event
        await logProjectEvent(projectId, {
          projectId,
          type: "payment_released",
          title: `Payment Released: ₹${pReq.amount.toLocaleString()}`,
          description: `Payment for "${pReq.description}" approved & escrow released.`,
          actorId: user.uid,
          actorName,
          actorRole: "client",
          relatedId: pReq.id,
          metadata: { amount: pReq.amount },
          createdAt: now
        });
      } else {
        await logProjectEvent(projectId, {
          projectId,
          type: "payment_rejected",
          title: `Payment Request Declined: ₹${pReq.amount.toLocaleString()}`,
          description: `Payment for "${pReq.description}" was declined by client.`,
          actorId: user.uid,
          actorName,
          actorRole: "client",
          relatedId: pReq.id,
          createdAt: now
        });
      }

      if (project.businessId) {
        await triggerNotification(
          project.businessId,
          newStatus === "approved" ? "Payment Approved!" : "Payment Request Declined",
          `Customer ${newStatus === "approved" ? "approved" : "declined"} payment request of ₹${pReq.amount.toLocaleString()}.`,
          "payment"
        );
      }
    } catch (err) {
      console.error("Error responding to payment request:", err);
    } finally {
      setActionProcessing(null);
    }
  };

  // Date Proposal & Confirmation Handlers
  const handleProposeDates = async (
    startDate: string,
    completionDate: string,
    durationDays?: number
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || "Contractor";
      const durationText = durationDays ? `${durationDays} Days` : "Custom Schedule";

      await updateDoc(doc(db, "projects", projectId), {
        proposedStartDate: startDate,
        proposedCompletionDate: completionDate,
        proposedTimelineEstimate: durationText,
        dateStatus: "pending_customer_approval",
        dateProposedBy: user.uid,
        dateProposedByName: actorName,
      });

      await logProjectEvent(projectId, {
        projectId,
        type: "milestone_started",
        title: `Schedule Change Proposed: Start ${startDate} · Target Completion ${completionDate}`,
        description: `Contractor proposed custom project schedule. Customer confirmation required.`,
        actorId: user.uid,
        actorName,
        actorRole: "professional",
        createdAt: now,
      });

      if (project.clientId) {
        await triggerNotification(
          project.clientId,
          "Schedule Change Proposed",
          `${actorName} proposed custom project dates: Start ${startDate}, Target ${completionDate} (${durationText}). Please verify & accept.`,
          "project_dates",
          projectId,
          `/workspace/${projectId}`
        );
      }
    } catch (err) {
      console.error("Error proposing project dates:", err);
    }
  };

  const handleAcceptProposedDates = async () => {
    if (!user || !project || !project.proposedStartDate) return;
    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || "Customer";

      await updateDoc(doc(db, "projects", projectId), {
        startDate: project.proposedStartDate,
        expectedCompletionDate: project.proposedCompletionDate || project.expectedCompletionDate,
        timelineEstimate: project.proposedTimelineEstimate || project.timelineEstimate,
        dateStatus: "accepted",
      });

      await logProjectEvent(projectId, {
        projectId,
        type: "agreement_signed",
        title: `Schedule Confirmed & Accepted: Start ${project.proposedStartDate}`,
        description: `Customer accepted project dates.`,
        actorId: user.uid,
        actorName,
        actorRole: "client",
        createdAt: now,
      });

      if (project.businessId) {
        await triggerNotification(
          project.businessId,
          "Schedule Accepted by Customer!",
          `Customer accepted the proposed project schedule (Start: ${project.proposedStartDate}).`,
          "project_dates",
          projectId,
          `/workspace/${projectId}`
        );
      }
    } catch (err) {
      console.error("Error accepting proposed dates:", err);
    }
  };

  const handleDeclineProposedDates = async () => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || "Customer";

      await updateDoc(doc(db, "projects", projectId), {
        dateStatus: "rejected",
      });

      await logProjectEvent(projectId, {
        projectId,
        type: "issue_reported",
        title: `Proposed Schedule Declined`,
        description: `Customer requested schedule adjustments.`,
        actorId: user.uid,
        actorName,
        actorRole: "client",
        createdAt: now,
      });

      if (project.businessId) {
        await triggerNotification(
          project.businessId,
          "Schedule Declined by Customer",
          `Customer declined the proposed dates. Please connect with customer to adjust timeline.`,
          "project_dates",
          projectId,
          `/workspace/${projectId}`
        );
      }
    } catch (err) {
      console.error("Error declining proposed dates:", err);
    }
  };

  // Geo-Tagged Media Upload Handler
  const handleUploadMediaWithGeo = async (
    file: File,
    milestoneId: string,
    caption: string,
    capturedAt: string,
    location?: { lat: number; lng: number; label?: string }
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || user.email?.split("@")[0] || "User";
      const fileUrl = await uploadProjectMediaImage(file, projectId);

      if (!fileUrl) {
        alert("Failed to compress and process image file.");
        return;
      }

      const targetMilestone = milestones.find((m) => m.id === milestoneId);

      const mediaDocObj: Record<string, any> = {
        projectId,
        type: file.type.startsWith("video") ? "video" : "image",
        url: fileUrl,
        caption,
        uploadedBy: user.uid,
        uploadedByName: actorName,
        createdAt: now,
        capturedAt: capturedAt || now,
      };

      if (milestoneId) {
        mediaDocObj.milestoneId = milestoneId;
        if (targetMilestone?.title) mediaDocObj.milestoneTitle = targetMilestone.title;
      }
      if (location) mediaDocObj.location = location;

      const mediaRef = await addDoc(collection(db, "projectMedia"), mediaDocObj);

      // Log Timeline Event
      await logProjectEvent(projectId, {
        projectId,
        type: "media_uploaded",
        title: `Geo-Tagged Progress Media Uploaded: "${caption}"`,
        description: `Stage: ${targetMilestone?.title || "Site Work"} · Time: ${new Date(capturedAt || now).toLocaleTimeString("en-IN")}${location?.label ? ` · ${location.label}` : ""}`,
        actorId: user.uid,
        actorName,
        actorRole: user.uid === project.clientId ? "client" : "professional",
        relatedId: mediaRef.id,
        createdAt: now,
      });

      const recipientId = user.uid === project.clientId ? project.businessId : project.clientId;
      if (recipientId) {
        await triggerNotification(
          recipientId,
          "New Site Photo Uploaded",
          `${actorName} uploaded progress media for "${targetMilestone?.title || "Project Work"}".`,
          "booking",
          projectId,
          `/workspace/${projectId}`
        );
      }
    } catch (err: any) {
      console.error("Error uploading geo media:", err);
      alert(`Upload Failed: ${err?.message || "Could not save site media."}`);
    }
  };

  // Decision Center Handlers
  const handleCreateDecision = async (
    title: string,
    description: string,
    options: any[],
    deadline: string
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const decData: Omit<ProjectDecision, "id"> = {
        projectId,
        title,
        description,
        options,
        deadline,
        status: "pending",
        createdBy: user.uid,
        createdByName: user.displayName || "Contractor",
        createdAt: now,
      };
      await addDoc(collection(db, "projects", projectId, "decisions"), decData);

      await logProjectEvent(projectId, {
        projectId,
        type: "decision_requested",
        title: `Customer Decision Required: "${title}"`,
        description: `Contractor created choice card for customer approval.`,
        actorId: user.uid,
        actorName: user.displayName || "Contractor",
        actorRole: "professional",
        createdAt: now,
      });

      if (project.clientId) {
        await triggerNotification(
          project.clientId,
          "Action Needed: Choice Approval",
          `Please approve selection for "${title}".`,
          "booking"
        );
      }
    } catch (err) {
      console.error("Error creating decision card:", err);
    }
  };

  const handleRespondDecision = async (
    decision: ProjectDecision,
    status: "approved" | "rejected" | "changes_requested",
    selectedOptionId?: string,
    customerNotes?: string
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "projects", projectId, "decisions", decision.id), {
        status,
        selectedOptionId: selectedOptionId || null,
        customerNotes: customerNotes || null,
        decidedAt: now,
      });

      await logProjectEvent(projectId, {
        projectId,
        type: `decision_${status}`,
        title: `Decision ${status.replace("_", " ").toUpperCase()}: "${decision.title}"`,
        description: customerNotes || `Customer responded to selection.`,
        actorId: user.uid,
        actorName: user.displayName || "Customer",
        actorRole: "client",
        createdAt: now,
      });
    } catch (err) {
      console.error("Error responding to decision:", err);
    }
  };

  // Issue Tracking & Change Request Handlers
  const handleCreateIssue = async (
    title: string,
    description: string,
    effectDays: number,
    extraCost: number
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const issData: Omit<ProjectIssue, "id"> = {
        projectId,
        title,
        description,
        effectDays,
        extraCost,
        reportedBy: user.uid,
        reportedByName: user.displayName || "User",
        reportedByRole: user.uid === project.clientId ? "client" : "professional",
        status: "pending",
        createdAt: now,
      };
      await addDoc(collection(db, "projects", projectId, "issues"), issData);

      await logProjectEvent(projectId, {
        projectId,
        type: "issue_reported",
        title: `Site Issue Reported: "${title}"`,
        description: `Effect: +${effectDays} days, Cost: +₹${extraCost}`,
        actorId: user.uid,
        actorName: user.displayName || "User",
        actorRole: user.uid === project.clientId ? "client" : "professional",
        createdAt: now,
      });
    } catch (err) {
      console.error("Error creating issue:", err);
    }
  };

  const handleRespondIssue = async (
    issue: ProjectIssue,
    status: "accepted" | "rejected" | "resolved",
    responseNotes?: string
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "projects", projectId, "issues", issue.id), {
        status,
        responseNotes: responseNotes || null,
        resolvedAt: now,
      });

      await logProjectEvent(projectId, {
        projectId,
        type: `issue_${status}`,
        title: `Issue ${status.toUpperCase()}: "${issue.title}"`,
        description: responseNotes || `Status updated to ${status}.`,
        actorId: user.uid,
        actorName: user.displayName || "User",
        actorRole: user.uid === project.clientId ? "client" : "professional",
        createdAt: now,
      });
    } catch (err) {
      console.error("Error responding to issue:", err);
    }
  };

  const handleCreateChangeRequest = async (
    title: string,
    description: string,
    extraCost: number,
    extraTimeDays: number
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      const crData: Omit<ProjectChangeRequest, "id"> = {
        projectId,
        title,
        description,
        extraCost,
        extraTimeDays,
        requestedBy: user.uid,
        requestedByName: user.displayName || "User",
        requestedByRole: user.uid === project.clientId ? "client" : "professional",
        status: "pending",
        createdAt: now,
      };
      await addDoc(collection(db, "projects", projectId, "changeRequests"), crData);

      await logProjectEvent(projectId, {
        projectId,
        type: "change_request_submitted",
        title: `Scope Change Request: "${title}"`,
        description: `Extra Cost: +₹${extraCost}, Extra Time: +${extraTimeDays} days`,
        actorId: user.uid,
        actorName: user.displayName || "User",
        actorRole: user.uid === project.clientId ? "client" : "professional",
        createdAt: now,
      });
    } catch (err) {
      console.error("Error creating change request:", err);
    }
  };

  const handleRespondChangeRequest = async (
    changeReq: ProjectChangeRequest,
    status: "approved" | "rejected"
  ) => {
    if (!user || !project) return;
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, "projects", projectId, "changeRequests", changeReq.id), {
        status,
        approvedAt: status === "approved" ? now : null,
      });

      if (status === "approved") {
        const newEstimatedCost = (project.estimatedCost || 150000) + changeReq.extraCost;
        await updateDoc(doc(db, "projects", projectId), {
          estimatedCost: newEstimatedCost,
          extraRequestsAmount: (project.extraRequestsAmount || 0) + changeReq.extraCost,
        });
      }

      await logProjectEvent(projectId, {
        projectId,
        type: `change_request_${status}`,
        title: `Change Request ${status.toUpperCase()}: "${changeReq.title}"`,
        description: `Customer ${status} scope variation of +₹${changeReq.extraCost}.`,
        actorId: user.uid,
        actorName: user.displayName || "Customer",
        actorRole: "client",
        createdAt: now,
      });
    } catch (err) {
      console.error("Error responding to change request:", err);
    }
  };

  // Add Stage Issue
  const handleAddStageIssue = async (milestone: Milestone) => {
    if (!newIssueTitle.trim() || !user) return;
    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || user.email?.split("@")[0] || "User";
      const existingIssues = milestone.issuesTracked || [];
      const newIssue = {
        id: Date.now().toString(),
        title: newIssueTitle.trim(),
        priority: newIssuePriority,
        reportedBy: actorName,
        status: "open" as const,
        createdAt: now
      };
      await updateDoc(doc(db, "milestones", milestone.id), {
        issuesTracked: [...existingIssues, newIssue]
      });
      setNewIssueTitle("");
    } catch (err) {
      console.error("Error adding stage issue:", err);
    }
  };

  // Toggle Stage Issue Status
  const handleToggleStageIssue = async (milestone: Milestone, issueId: string) => {
    try {
      const existingIssues = milestone.issuesTracked || [];
      const updated = existingIssues.map((iss) =>
        iss.id === issueId ? { ...iss, status: iss.status === "open" ? ("resolved" as const) : ("open" as const) } : iss
      );
      await updateDoc(doc(db, "milestones", milestone.id), {
        issuesTracked: updated
      });
    } catch (err) {
      console.error("Error toggling stage issue:", err);
    }
  };

  // Add Structured Stage Note
  const handleAddStructuredNote = async (milestone: Milestone) => {
    if (!newNoteText.trim() || !user || !project) return;
    try {
      const now = new Date().toISOString();
      const isClient = user.uid === project.clientId;
      const authorRole = isClient ? "Customer" : "Contractor";
      const authorName = user.displayName || user.email?.split("@")[0] || authorRole;
      const existingNotes = milestone.structuredNotes || [];
      const newNote = {
        id: Date.now().toString(),
        note: newNoteText.trim(),
        authorName,
        authorRole,
        createdAt: now
      };
      await updateDoc(doc(db, "milestones", milestone.id), {
        structuredNotes: [...existingNotes, newNote]
      });
      setNewNoteText("");
    } catch (err) {
      console.error("Error adding structured note:", err);
    }
  };

  // 6. Daily Progress Log Chain Cascade
  const handleDailyLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project) return;
    setActionProcessing("dailyLog");

    try {
      const now = new Date().toISOString();
      const todayStr = now.split("T")[0];
      const actorName = user.displayName || "Contractor";

      const logData: Omit<DailyLog, "id"> = {
        projectId,
        date: todayStr,
        workersPresent: logWorkers,
        hoursWorked: logHours,
        workSummary: logSummaryBullets,
        overallCompletionPercent: logOverallPercent,
        submittedBy: user.uid,
        createdAt: now
      };
      if (selectedStageId !== "all") logData.milestoneId = selectedStageId;
      if (logIssues.trim()) logData.issues = logIssues.trim();
      if (logTomorrow.trim()) logData.tomorrowPlan = logTomorrow.trim();

      const logDocRef = await addDoc(collection(db, "dailyLogs"), logData);

      // Upload Media if provided
      if (logMediaFile) {
        let fileUrl = "";
        try {
          const storageRef = ref(storage, `projectMedia/${projectId}/${Date.now()}_${logMediaFile.name}`);
          await uploadBytes(storageRef, logMediaFile);
          fileUrl = await getDownloadURL(storageRef);
        } catch (err) {
          fileUrl = await compressImageToBase64(logMediaFile);
        }

        const mediaDocObj: Record<string, any> = {
          projectId,
          type: logMediaFile.type.startsWith("video") ? "video" : "image",
          url: fileUrl,
          caption: `Site log media - ${todayStr}`,
          uploadedBy: user.uid,
          uploadedByName: actorName,
          createdAt: now
        };
        if (selectedStageId !== "all") mediaDocObj.milestoneId = selectedStageId;
        await addDoc(collection(db, "projectMedia"), mediaDocObj);
      }

      // Update Project doc
      await updateDoc(doc(db, "projects", projectId), {
        progressPercent: logOverallPercent,
        currentStage: logSummaryBullets[0] || project.currentStage || "Site Work"
      });

      // Log Timeline Event
      await logProjectEvent(projectId, {
        projectId,
        type: "daily_log_submitted",
        title: `Site Progress Log Published (${logWorkers} Workers, ${logHours} Hrs)`,
        description: logSummaryBullets.join(" · "),
        actorId: user.uid,
        actorName,
        actorRole: "professional",
        relatedId: logDocRef.id,
        metadata: {
          workers: logWorkers,
          hours: logHours,
          progressPercent: logOverallPercent,
          ...(selectedStageId !== "all" ? { milestoneId: selectedStageId } : {})
        },
        createdAt: now
      });

      if (project.clientId) {
        await triggerNotification(
          project.clientId,
          "Daily Progress Log Published",
          `${actorName} posted today's site report (${logOverallPercent}% total completion).`,
          "booking"
        );
      }

      setLogIssues("");
      setLogTomorrow("");
    } catch (err) {
      console.error("Error submitting daily log:", err);
    } finally {
      setActionProcessing(null);
    }
  };

  // 7. Document Upload Handler
  const handleDocumentUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !docFile) return;
    setUploadingDoc(true);

    try {
      const now = new Date().toISOString();
      const actorName = user.displayName || user.email?.split("@")[0] || "User";

      let fileUrl = "";
      try {
        const storageRef = ref(storage, `projectDocuments/${projectId}/${Date.now()}_${docFile.name}`);
        await uploadBytes(storageRef, docFile);
        fileUrl = await getDownloadURL(storageRef);
      } catch (err) {
        fileUrl = await compressImageToBase64(docFile);
      }

      const docData: Omit<ProjectDocument, "id"> = {
        projectId,
        type: docType,
        name: docName.trim() || docFile.name,
        fileUrl,
        uploadedBy: user.uid,
        version: 1,
        status: "verified",
        verified: true,
        createdAt: now
      };
      if (selectedStageId !== "all") docData.milestoneId = selectedStageId;

      const docRef = await addDoc(collection(db, "projectDocuments"), docData);

      // Log Timeline Event
      await logProjectEvent(projectId, {
        projectId,
        type: docType === "blueprint" ? "blueprint_uploaded" : "document_uploaded",
        title: `Document Vaulted: "${docData.name}"`,
        description: `Category: ${docType.replace("_", " ").toUpperCase()}`,
        actorId: user.uid,
        actorName,
        actorRole: user.uid === project.clientId ? "client" : "professional",
        relatedId: docRef.id,
        createdAt: now
      });

      setDocName("");
      setDocFile(null);
    } catch (err) {
      console.error("Error uploading document:", err);
    } finally {
      setUploadingDoc(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen mode="brand" />;
  }

  const isAuthorized = user && project && (
    user.uid === project.clientId || 
    user.uid === project.businessId || 
    user.uid === (project as any).workerId || 
    user.uid === (project as any).professionalId || 
    user.uid === (project as any).customerId || 
    !!user.uid
  );

  if (!user || !project || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Workspace Restricted</h1>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            You do not have active credentials to enter this project room, or it has been archived.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md hover:bg-slate-800 transition"
          >
            Back to Dashboard
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Dynamic Derived Computations (Strict Authenticated Account Roles)
  const isClient = user.uid === project.clientId;
  const isBusiness = user.uid === project.businessId || user.uid === (project as any).workerId || user.uid === (project as any).professionalId;
  const actorRole = isClient ? "client" : "professional";
  const progressVal = project.progressPercent ?? 0;
  const totalPaid = project.totalPaid ?? paymentRequests.filter((p) => p.status === "approved" || p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalBudgetVal = project.estimatedCost || 150000;
  const pendingApprovalsCount = milestones.filter((m) => m.proApproved && !m.clientApproved).length + paymentRequests.filter((p) => p.status === "pending").length;
  const pendingPaymentsAmount = paymentRequests.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const trustScore = project.projectTrustScore ?? 92;

  // Financial Intelligence Derived Metrics
  const lockedEscrow = Math.max(0, (project.escrowFunded || totalPaid) - totalPaid);
  const retentionAmount = project.retentionAmount || Math.round(totalBudgetVal * 0.05);
  const extraRequestsAmount = project.extraRequestsAmount || 0;

  // Stage-Filtered Computed Arrays
  const filteredEvents = selectedStageId === "all" ? events : events.filter(e => e.relatedId === selectedStageId || e.metadata?.milestoneId === selectedStageId);
  const filteredMilestones = selectedStageId === "all" ? milestones : milestones.filter(m => m.id === selectedStageId);
  const filteredLogs = selectedStageId === "all" ? dailyLogs : dailyLogs.filter(l => l.milestoneId === selectedStageId || !l.milestoneId);
  const filteredDocs = selectedStageId === "all" ? documents : documents.filter(d => d.milestoneId === selectedStageId || !d.milestoneId);
  const filteredPayments = selectedStageId === "all" ? paymentRequests : paymentRequests.filter(p => p.milestoneId === selectedStageId || !p.milestoneId);
  const filteredChat = selectedStageId === "all" ? chatMessages : chatMessages.filter(m => m.milestoneId === selectedStageId || !m.milestoneId);

  // Dynamic Alerts Engine
  const activeAlerts = generateProjectAlerts(milestones, dailyLogs, documents, paymentRequests, warranty);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      {/* Stage Completion Wizard Modal */}
      {showCompletionWizardModal && selectedStageId !== "all" && (() => {
        const activeMilestone = milestones.find(m => m.id === selectedStageId);
        if (!activeMilestone) return null;

        const stageTasks = activeMilestone.tasks || [];
        const tasksDone = stageTasks.length === 0 || stageTasks.every(t => t.completed);
        const docsRequired = activeMilestone.documentsRequired || [];
        const docsDone = docsRequired.every(reqDoc => documents.some(d => d.type === reqDoc && d.status !== "rejected"));
        const mediaDone = !activeMilestone.mediaRequired || mediaList.some(med => med.milestoneId === activeMilestone.id);
        const approvalsDone = activeMilestone.proApproved;
        const clientVerified = activeMilestone.clientApproved;
        const canFinalize = tasksDone && docsDone && mediaDone;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-[8px] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase">Stage Completion Verification Wizard</h3>
                </div>
                <button onClick={() => setShowCompletionWizardModal(false)} className="p-1 rounded-[4px] hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  Verifying completion criteria for stage <strong className="text-slate-900 font-extrabold">"{activeMilestone.title}"</strong>:
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-[6px] border bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">1. Work Checklist Items ({stageTasks.filter(t => t.completed).length}/{stageTasks.length})</span>
                    <span className={`text-xs font-black ${tasksDone ? "text-emerald-600" : "text-amber-600"}`}>{tasksDone ? "✓ Verified" : "Pending Tasks"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-[6px] border bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">2. Required Document Vaulting ({docsRequired.length} Required)</span>
                    <span className={`text-xs font-black ${docsDone ? "text-emerald-600" : "text-amber-600"}`}>{docsDone ? "✓ Vaulted" : "Missing Documents"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-[6px] border bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">3. Site Execution Media & Proofs</span>
                    <span className={`text-xs font-black ${mediaDone ? "text-emerald-600" : "text-amber-600"}`}>{mediaDone ? "✓ Media Uploaded" : "Missing Photos"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-[6px] border bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">4. Contractor Inspection Signoff</span>
                    <span className={`text-xs font-black ${approvalsDone ? "text-emerald-600" : "text-amber-600"}`}>{approvalsDone ? "✓ Signed Off" : "Pending Signoff"}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-[6px] border bg-slate-50">
                    <span className="text-xs font-bold text-slate-800">5. Customer Verification Signoff</span>
                    <span className={`text-xs font-black ${clientVerified ? "text-emerald-600" : "text-amber-600"}`}>{clientVerified ? "✓ Verified" : "Pending Customer"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => setShowCompletionWizardModal(false)}
                  className="px-4 py-2 rounded-[6px] border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Close Wizard
                </button>
                {isBusiness && !activeMilestone.proApproved && (
                  <button
                    disabled={!canFinalize}
                    onClick={async () => {
                      await handleRequestMilestoneInspection(activeMilestone);
                      setShowCompletionWizardModal(false);
                    }}
                    className="px-4 py-2 rounded-[6px] bg-[#0f2744] hover:bg-[#1e3a8a] text-white text-xs font-extrabold uppercase tracking-wider disabled:opacity-50"
                  >
                    Submit Inspection Request →
                  </button>
                )}
                {isClient && activeMilestone.proApproved && !activeMilestone.clientApproved && (
                  <button
                    onClick={async () => {
                      await handleApproveMilestone(activeMilestone);
                      setShowCompletionWizardModal(false);
                    }}
                    className="px-4 py-2 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-wider"
                  >
                    Approve Stage Finalization ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Lightbox Media View */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <button onClick={() => setLightboxMedia(null)} className="absolute top-6 right-6 text-white p-2 rounded-full bg-slate-900 border border-slate-800">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col items-center space-y-3 text-center">
            {lightboxMedia.type === "video" ? (
              <video src={lightboxMedia.url} controls autoPlay className="max-h-[70vh] rounded-2xl border border-slate-800" />
            ) : (
              <img src={lightboxMedia.url} alt="" className="max-h-[70vh] object-contain rounded-2xl border border-slate-800" />
            )}
            <p className="text-white text-xs font-semibold">{lightboxMedia.caption || "Site Photo"}</p>
          </div>
        </div>
      )}

      {/* Project Notifications Drawer */}
      <ProjectNotificationsDrawer
        projectId={projectId}
        userId={user.uid}
        isOpen={showProjectNotifDrawer}
        onClose={() => setShowProjectNotifDrawer(false)}
        onNavigateTab={(t) => setActiveTab(t as any)}
      />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 pb-24 space-y-6">

        {/* ── 1. PROJECT HUB EXECUTIVE STATUS HEADER (10-SECOND SUMMARY) ── */}
        <ProjectHubHeader
          project={project}
          proProfile={proProfile}
          isClient={isClient}
          pendingApprovalsCount={pendingApprovalsCount + decisions.filter((d) => d.status === "pending").length}
          pendingPaymentAmount={pendingPaymentsAmount}
          todayPhotosCount={mediaList.filter((m) => new Date(m.createdAt).toDateString() === new Date().toDateString()).length}
          currentStageName={project.currentStage || milestones.find((m) => m.status === "in_progress")?.title || milestones[0]?.title || "Planning"}
          nextMilestoneName={milestones.find((m) => m.status === "pending")?.title || "Completion"}
          unreadNotifCount={projectNotifications.filter((n) => !n.read).length}
          onNavigateTab={(t) => setActiveTab(t)}
          onOpenNotifications={() => setShowProjectNotifDrawer(true)}
          onProposeDates={handleProposeDates}
          onAcceptProposedDates={handleAcceptProposedDates}
          onDeclineProposedDates={handleDeclineProposedDates}
        />

        {/* ── PHASE 6: SMART ALERTS ENGINE BANNER ── */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2.5 mb-6">
            {activeAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.id}
                className={`p-3.5 rounded-[8px] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs ${
                  alert.type === "urgent"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : alert.type === "warning"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-indigo-50 border-indigo-200 text-indigo-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <div>
                    <span className="font-bold text-xs block">{alert.title}</span>
                    <span className="text-[11px] font-medium">{alert.message}</span>
                  </div>
                </div>
                {alert.actionTab && (
                  <button
                    onClick={() => setActiveTab(alert.actionTab as any)}
                    className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 px-3 py-1 rounded-[6px] text-xs font-bold whitespace-nowrap transition cursor-pointer shadow-xs"
                  >
                    View in {alert.actionTab.toUpperCase()} →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CUSTOMER VERIFICATION & APPROVAL REQUIRED BANNER ── */}
        {milestones.some((m) => m.proApproved && !m.clientApproved) && (
          <div className="bg-amber-50 border border-amber-300 p-4.5 rounded-[8px] mb-6 space-y-3 shadow-subtle">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                  🔔
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-amber-950">
                    {isClient ? "Customer Verification Needed: Pending Milestone Inspection" : "Awaiting Customer Verification from Customer Account"}
                  </h3>
                  <p className="text-[11px] text-amber-800 font-medium">
                    {isClient
                      ? "Contractor has submitted milestone completion for your physical site verification and signoff."
                      : "Contractor cannot self-approve. The customer must log in from their customer account to verify and approve."}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-200/80 text-amber-900 rounded-[4px] text-[9px] font-bold uppercase">
                2-Way Gate Active
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {milestones.filter((m) => m.proApproved && !m.clientApproved).map((m) => (
                <div key={m.id} className="bg-white border border-amber-200 p-3.5 rounded-[6px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="font-extrabold text-xs text-slate-900 block">Stage: {m.title}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Submitted by Contractor · Verified Site Inspection Required</span>
                  </div>
                  {isClient ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        disabled={actionProcessing === m.id}
                        onClick={() => handleApproveMilestone(m)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-[6px] text-xs uppercase tracking-wider transition cursor-pointer shadow-xs flex-1 sm:flex-none text-center"
                      >
                        Verify & Approve Stage ✓
                      </button>
                      <button
                        disabled={actionProcessing === m.id}
                        onClick={() => setRejectingMilestoneId(m.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-[6px] text-xs transition cursor-pointer shadow-xs flex-1 sm:flex-none text-center"
                      >
                        Reject / Request Rework
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-[4px] border border-amber-200">
                      ⌛ Awaiting Customer Log-in to Approve
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PERMANENT STAGE-FILTERED WORKFLOW STEPPER BAR ── */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-[8px] shadow-subtle mb-6 space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0f2744]" /> Active Workflow Stage Workspace ({milestones.length} Stages)
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button
              onClick={() => setSelectedStageId("all")}
              className={`px-3.5 py-2 rounded-[6px] font-bold text-xs whitespace-nowrap transition cursor-pointer border ${
                selectedStageId === "all"
                  ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle font-black"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              🌐 All Stages ({milestones.length})
            </button>

            {milestones.map((m, idx) => {
              const isActive = selectedStageId === m.id;
              const isDone = m.status === "completed";
              const isBlocked = !canStartMilestone(m, milestones).allowed;

              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedStageId(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-bold text-xs whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? "bg-[#0f2744] text-white border-[#0f2744] shadow-subtle font-black"
                      : isDone
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : isBlocked
                      ? "bg-amber-50/60 text-amber-800 border-amber-200/80"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>#{m.order || idx + 1}. {m.title}</span>
                  {isDone ? (
                    <span className="text-[10px] text-emerald-600 font-black">✓</span>
                  ) : isBlocked ? (
                    <span className="text-[10px] text-amber-700 font-black">🔒</span>
                  ) : (
                    <span className="text-[10px] text-indigo-600 font-black">▶</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DYNAMIC STAGE MINI-WORKSPACE INTELLIGENCE HUB ── */}
        {selectedStageId !== "all" && (() => {
          const activeMilestone = milestones.find(m => m.id === selectedStageId);
          if (!activeMilestone) return null;

          const isCompleted = activeMilestone.status === "completed";
          const depCheck = canStartMilestone(activeMilestone, milestones);
          const isBlocked = !depCheck.allowed;

          // Health Calculation
          let healthStatus: 'healthy' | 'attention_required' | 'locked' = 'healthy';
          let healthReason = "On Schedule & Verification Ready";
          const healthReasonsList: string[] = [];

          if (isBlocked) {
            healthStatus = 'locked';
            healthReason = depCheck.reason || "Waiting for prerequisite stage completion";
          } else if (!isCompleted) {
            if (activeMilestone.documentsRequired?.some(reqDoc => !documents.some(d => d.type === reqDoc && d.status !== 'rejected'))) {
              healthStatus = 'attention_required';
              healthReasonsList.push("Required Document Missing");
            }
            if (activeMilestone.mediaRequired && !mediaList.some(med => med.milestoneId === activeMilestone.id)) {
              healthStatus = 'attention_required';
              healthReasonsList.push("Required Site Photos Missing");
            }
            if (activeMilestone.proApproved && !activeMilestone.clientApproved) {
              healthStatus = 'attention_required';
              healthReasonsList.push("Awaiting Customer Verification Signoff");
            }
            if (healthReasonsList.length > 0) {
              healthReason = healthReasonsList.join(" · ");
            }
          }

          const stageTasks = activeMilestone.tasks || [];
          const completedTasksCount = stageTasks.filter(t => t.completed).length;
          const calculatedPct = stageTasks.length > 0
            ? Math.round((completedTasksCount / stageTasks.length) * 100)
            : (activeMilestone.progressPercent || (isCompleted ? 100 : 0));

          const nextMilestone = milestones.find(m => m.order === (activeMilestone.order || 1) + 1);
          const prevMilestone = milestones.find(m => m.order === (activeMilestone.order || 1) - 1);

          // Calculate Next Required Action
          let nextActionText = "Execute site work & update checklist tasks";
          let nextActionColor = "bg-[#0f2744] text-white";
          let nextActionTrigger = () => setActiveStageSubTab("overview");

          if (isBlocked) {
            nextActionText = `Complete prerequisite stage: ${depCheck.reason}`;
            nextActionColor = "bg-amber-600 text-white";
          } else if (activeMilestone.proApproved && !activeMilestone.clientApproved) {
            nextActionText = isClient ? "Verify & Approve Stage Completion" : "Waiting for Customer Verification Signoff";
            nextActionColor = isClient ? "bg-emerald-600 text-white" : "bg-[#0f2744] text-white";
            nextActionTrigger = () => isClient ? handleApproveMilestone(activeMilestone) : null;
          } else if (activeMilestone.documentsRequired?.some(reqDoc => !documents.some(d => d.type === reqDoc && d.status !== 'rejected'))) {
            nextActionText = `Upload required document: ${activeMilestone.documentsRequired.find(reqDoc => !documents.some(d => d.type === reqDoc))?.replace("_", " ").toUpperCase()}`;
            nextActionColor = "bg-[#0f2744] text-white";
            nextActionTrigger = () => setActiveStageSubTab("documents");
          } else if (!activeMilestone.proApproved && isBusiness && calculatedPct >= 80) {
            nextActionText = "Submit Milestone Inspection Request";
            nextActionColor = "bg-[#059669] text-white";
            nextActionTrigger = () => handleRequestMilestoneInspection(activeMilestone);
          }

          return (
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] shadow-subtle mb-6 space-y-6 animate-fade-in text-left">
              {/* Header Bar */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider bg-[#0f2744] text-white">
                      STAGE #{activeMilestone.order || 1} MINI-WORKSPACE
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-wider border ${
                      healthStatus === 'healthy' ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                      healthStatus === 'attention_required' ? "bg-amber-50 text-amber-800 border-amber-200" :
                      "bg-rose-50 text-rose-800 border-rose-200"
                    }`}>
                      {healthStatus === 'healthy' ? "🟢 Healthy" : healthStatus === 'attention_required' ? "🟠 Attention Required" : "🔒 Locked"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{activeMilestone.title}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {healthReason}
                  </p>
                </div>

                {/* Shortcuts & Completion Wizard Trigger */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {prevMilestone && (
                    <button
                      onClick={() => setSelectedStageId(prevMilestone.id)}
                      className="px-3 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer border border-slate-200"
                    >
                      ← Prev Stage
                    </button>
                  )}
                  {nextMilestone && (
                    <button
                      onClick={() => setSelectedStageId(nextMilestone.id)}
                      className="px-3 py-1.5 rounded-[6px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition cursor-pointer border border-slate-200"
                    >
                      Next Stage →
                    </button>
                  )}
                  <button
                    onClick={() => setShowCompletionWizardModal(true)}
                    className="px-3.5 py-1.5 rounded-[6px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-subtle flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Stage Signoff Wizard
                  </button>
                </div>
              </div>

              {/* STAGE NEXT ACTION CENTER BANNER */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-[6px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[#0f2744] text-amber-400 flex items-center justify-center font-bold shrink-0">
                    ⚡
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-indigo-900 tracking-wider block">NEXT REQUIRED STAGE ACTION</span>
                    <span className="text-xs font-black text-slate-900">{nextActionText}</span>
                  </div>
                </div>
                {nextActionTrigger && (
                  <button
                    onClick={nextActionTrigger}
                    className={`px-3.5 py-2 rounded-[6px] font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-subtle ${nextActionColor}`}
                  >
                    Execute Action →
                  </button>
                )}
              </div>

              {/* STAGE SUB-TABS NAVIGATION */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 hide-scrollbar">
                {[
                  { id: "overview", label: "Overview & Instructions", icon: Info },
                  { id: "chat", label: "Stage Chat Thread", icon: MessageSquare, count: chatMessages.filter(m => m.milestoneId === activeMilestone.id).length },
                  { id: "documents", label: "Categorized Files", icon: FileText, count: documents.filter(d => d.milestoneId === activeMilestone.id).length },
                  { id: "media", label: "Photos & Media", icon: ImageIcon, count: mediaList.filter(m => m.milestoneId === activeMilestone.id).length },
                  { id: "logs", label: "Daily Site Logs", icon: Clock, count: dailyLogs.filter(l => l.milestoneId === activeMilestone.id).length },
                  { id: "issues", label: "Risk & Issue Tracker", icon: AlertTriangle, count: (activeMilestone.issuesTracked || []).filter(i => i.status === "open").length },
                  { id: "notes", label: "Structured Decision Notes", icon: Pin, count: (activeMilestone.structuredNotes || []).length },
                ].map((subTab) => {
                  const Icon = subTab.icon;
                  const isActive = activeStageSubTab === subTab.id;
                  return (
                    <button
                      key={subTab.id}
                      onClick={() => setActiveStageSubTab(subTab.id as any)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] font-extrabold text-xs whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? "bg-[#0f2744] text-white shadow-subtle"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{subTab.label}</span>
                      {subTab.count !== undefined && subTab.count > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-[4px] text-[8.5px] font-black ${isActive ? "bg-amber-400 text-slate-950" : "bg-slate-200 text-slate-800"}`}>
                          {subTab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* SUB-TAB 1: OVERVIEW, OBJECTIVES & TEMPLATE INSTRUCTIONS */}
              {activeStageSubTab === "overview" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Objectives Checklist */}
                    <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-[6px] space-y-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-[#059669]" /> Stage Objectives
                      </h4>
                      <div className="space-y-2 text-xs font-semibold text-slate-700">
                        {(activeMilestone.objectives || [`Complete core ${activeMilestone.title} work package`, "Verify specs and hardware fittings", "Obtain client review & verification"]).map((obj, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[#059669] font-black mt-0.5">•</span>
                            <span>{obj}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Template Instructions */}
                    <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-[6px] space-y-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-600" /> Template Work Guidelines & Instructions
                      </h4>
                      <div className="space-y-2 text-xs font-semibold text-slate-700">
                        {(activeMilestone.instructions || [`Execute ${activeMilestone.title} according to approved drawings & layout.`, "Adhere to strict safety guidelines and quality inspection standards.", "Capture execution photos/videos before proceeding to next stage."]).map((inst, i) => (
                          <div key={i} className="flex items-start gap-2 bg-white p-2 rounded-[4px] border border-slate-200/80">
                            <span className="text-indigo-600 font-bold">#{i + 1}</span>
                            <span>{inst}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Checklist */}
                  <div className="bg-white border border-slate-200 p-5 rounded-[6px] space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Stage Work Checklist Items</h4>
                      <span className="text-[10px] font-bold text-slate-500">{completedTasksCount} / {stageTasks.length} Completed</span>
                    </div>
                    {stageTasks.length === 0 ? (
                      <p className="text-xs text-slate-400 font-semibold py-2">No custom tasks added for this stage.</p>
                    ) : (
                      <div className="space-y-2">
                        {stageTasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-[6px]">
                            <label className="flex items-center gap-3 text-xs font-bold text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={t.completed}
                                onChange={() => handleToggleTask(activeMilestone, t.id)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0f2744] focus:ring-[#0f2744]"
                              />
                              <span className={t.completed ? "line-through text-slate-400" : ""}>{t.title}</span>
                            </label>
                            {t.completedBy && (
                              <span className="text-[9px] text-slate-400 font-bold">Checked by {t.completedBy}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: STAGE CHAT THREAD */}
              {activeStageSubTab === "chat" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      Isolated Stage Discussion Thread ({chatMessages.filter(m => m.milestoneId === activeMilestone.id).length} Messages)
                    </h4>
                  </div>
                  <div className="h-72 overflow-y-auto space-y-3 bg-slate-50 p-4 rounded-[6px] border border-slate-200 custom-scrollbar">
                    {chatMessages.filter(m => m.milestoneId === activeMilestone.id).map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? "items-end" : "items-start"}`}>
                        <span className="text-[9px] text-slate-400 font-bold mb-0.5">{msg.senderName}</span>
                        <div className={`p-3 rounded-[6px] max-w-[85%] text-xs font-semibold shadow-xs ${
                          msg.senderId === user.uid ? "bg-[#0f2744] text-white" : "bg-white border border-slate-200 text-slate-900"
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatMessages.filter(m => m.milestoneId === activeMilestone.id).length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-10 font-semibold">No discussions posted for this stage yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: CATEGORIZED FILES */}
              {activeStageSubTab === "documents" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">
                      Categorized Stage Files & Vault ({documents.filter(d => d.milestoneId === activeMilestone.id).length} Documents)
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {documents.filter(d => d.milestoneId === activeMilestone.id).map((doc) => (
                      <div key={doc.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-[#0f2744] shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block">{doc.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{doc.type}</span>
                          </div>
                        </div>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white border border-slate-200 rounded-[4px] text-slate-700 hover:text-[#0f2744]">
                          <FileDown className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                    {documents.filter(d => d.milestoneId === activeMilestone.id).length === 0 && (
                      <p className="col-span-full text-center text-slate-400 text-xs py-8 font-semibold">No documents uploaded for this stage.</p>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: RISK & ISSUE TRACKER */}
              {activeStageSubTab === "issues" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Stage Risk & Issue Tracker</h4>
                  </div>

                  {/* Add Issue Form */}
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-[6px] border border-slate-200">
                    <input
                      type="text"
                      placeholder="Report a new stage issue or material delay..."
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-[4px] text-xs font-semibold outline-none"
                    />
                    <select
                      value={newIssuePriority}
                      onChange={(e) => setNewIssuePriority(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-[4px] text-xs font-bold"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <button
                      onClick={() => handleAddStageIssue(activeMilestone)}
                      className="px-3.5 py-1.5 bg-[#0f2744] text-white rounded-[4px] text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Report Issue
                    </button>
                  </div>

                  {/* Issue List */}
                  <div className="space-y-2">
                    {(activeMilestone.issuesTracked || []).map((iss) => (
                      <div key={iss.id} className="p-3 bg-white border border-slate-200 rounded-[6px] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-[3px] ${
                            iss.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            iss.priority === "medium" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {iss.priority}
                          </span>
                          <span className={`text-xs font-bold ${iss.status === "resolved" ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {iss.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-slate-400 font-bold">Reported by {iss.reportedBy}</span>
                          <button
                            onClick={() => handleToggleStageIssue(activeMilestone, iss.id)}
                            className={`px-2.5 py-1 rounded-[4px] text-[9.5px] font-extrabold uppercase transition cursor-pointer border ${
                              iss.status === "resolved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            {iss.status === "resolved" ? "✓ Resolved" : "Mark Resolved"}
                          </button>
                        </div>
                      </div>
                    ))}
                    {(activeMilestone.issuesTracked || []).length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-6 font-semibold">No issues logged for this stage. Everything is clear!</p>
                    )}
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: STRUCTURED PERMANENT NOTES */}
              {activeStageSubTab === "notes" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Permanent Decision & Material Change Notes</h4>
                  </div>

                  {/* Add Note Form */}
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-[6px] border border-slate-200">
                    <input
                      type="text"
                      placeholder="Add a permanent decision note (e.g., Customer requested matte finish)..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-[4px] text-xs font-semibold outline-none"
                    />
                    <button
                      onClick={() => handleAddStructuredNote(activeMilestone)}
                      className="px-3.5 py-1.5 bg-[#0f2744] text-white rounded-[4px] text-xs font-extrabold uppercase tracking-wider cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-2">
                    {(activeMilestone.structuredNotes || []).map((n) => (
                      <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-[6px] space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-indigo-700">{n.authorName} ({n.authorRole})</span>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{n.note}</p>
                      </div>
                    ))}
                    {(activeMilestone.structuredNotes || []).length === 0 && (
                      <p className="text-center text-slate-400 text-xs py-6 font-semibold">No permanent notes logged for this stage.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })()}

        {/* ── PROJECT HUB CONTROL CENTER TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 hide-scrollbar border-b border-slate-200">
          {[
            { id: "overview", label: "Overview & Activity Feed", icon: Layers, badge: events.length },
            { id: "stages", label: "Milestones & Stages", icon: CheckCircle2, count: milestones.length },
            { id: "logs", label: "Daily Work Reports", icon: Clock, count: dailyLogs.length },
            { id: "decisions", label: "Decision Center", icon: Sparkles, badge: decisions.filter((d) => d.status === "pending").length },
            { id: "issues", label: "Issues & Changes", icon: AlertTriangle, badge: changeRequests.filter((c) => c.status === "pending").length + issues.filter((i) => i.status === "pending").length },
            { id: "gallery", label: "Progress Gallery", icon: Camera, count: mediaList.length },
            { id: "financials", label: "Payments & Escrow", icon: IndianRupee, badge: paymentRequests.filter((p) => p.status === "pending").length },
            { id: "documents", label: "Categorized Documents", icon: FileText, count: documents.length },
            { id: "materials", label: "Material Tracker", icon: Wrench, count: materials.length },
            { id: "team", label: "Team Roster", icon: Users, count: teamMembers.length },
            { id: "completion", label: "Health & Completion", icon: Award },
            { id: "communication", label: "Chat & Notes", icon: MessageSquare, badge: chatMessages.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[6px] font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white font-black shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="ml-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-black bg-indigo-600 text-white">
                    {tab.badge}
                  </span>
                ) : tab.count !== undefined && tab.count > 0 ? (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${isActive ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ── SECTION 1: OVERVIEW & GITHUB-STYLE ACTIVITY TIMELINE FEED ── */}
        {activeTab === "overview" && (
          <ActivityTimelineFeed
            events={events}
            dailyLogs={dailyLogs}
            mediaList={mediaList}
          />
        )}

        {/* ── SECTION: DECISION CENTER (CUSTOMER APPROVALS) ── */}
        {activeTab === "decisions" && (
          <DecisionCenterModal
            decisions={decisions}
            isClient={isClient}
            onRespondDecision={handleRespondDecision}
            onCreateDecision={handleCreateDecision}
          />
        )}

        {/* ── SECTION: ISSUES & CHANGE REQUESTS ── */}
        {activeTab === "issues" && (
          <IssuesAndChangesTab
            issues={issues}
            changeRequests={changeRequests}
            isClient={isClient}
            onRespondIssue={handleRespondIssue}
            onRespondChangeRequest={handleRespondChangeRequest}
            onCreateIssue={handleCreateIssue}
            onCreateChangeRequest={handleCreateChangeRequest}
          />
        )}

        {/* ── SECTION: PROGRESS GALLERY (ORGANIZED BY STAGE) ── */}
        {activeTab === "gallery" && (
          <StageGalleryView
            mediaList={mediaList}
            milestones={milestones}
            onUploadMediaWithGeo={handleUploadMediaWithGeo}
          />
        )}

        {/* ── SECTION: PROJECT HEALTH & FINAL COMPLETION RECORD ── */}
        {activeTab === "completion" && (
          <div className="space-y-6">
            <ProjectHealthCard
              project={project}
              milestones={milestones}
              issues={issues}
              pendingApprovalsCount={pendingApprovalsCount}
            />

            <CompletionRecordCard
              project={project}
              proProfile={proProfile}
              warranty={warranty}
              photosCount={mediaList.filter((m) => m.type === "image").length}
              videosCount={mediaList.filter((m) => m.type === "video").length}
              invoicesCount={documents.filter((d) => d.type === "invoice" || d.type === "receipt").length}
            />
          </div>
        )}

        {/* ── SECTION 2: COMMUNICATION & PINNED NOTES ── */}
        {activeTab === "communication" && (
          <div className="bg-white border border-slate-200 rounded-[8px] p-6 space-y-5 animate-fade-in shadow-subtle">
            <div className="border-b border-slate-100 pb-3.5">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Project Communication Hub</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time messages, voice note uploads, location shares & pinned meeting notes</p>
            </div>

            {/* Chat Stream */}
            <div className="h-96 overflow-y-auto space-y-3 bg-slate-50 p-4 rounded-[6px] border border-slate-200 custom-scrollbar">
              {filteredChat.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.senderId === user.uid ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] text-slate-400 font-bold mb-0.5">{msg.senderName}</span>
                  <div className={`p-3 rounded-[6px] max-w-[85%] text-xs leading-relaxed font-semibold shadow-xs ${
                    msg.senderId === user.uid ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-900"
                  }`}>
                    {msg.text}
                    {msg.voiceNoteUrl && (
                      <audio src={msg.voiceNoteUrl} controls className="mt-2 w-full max-w-xs" />
                    )}
                    {msg.location && (
                      <div className="mt-2 p-2 bg-slate-100 rounded-[4px] text-[10px] text-indigo-700 flex items-center gap-1.5 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{msg.location.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <input
                type="text"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Type workspace message or meeting notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-[6px] p-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setVoiceNoteUrl("https://example.com/demo_voicenote.mp3")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-bold rounded-[6px] border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-600" /> Attach Voice Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationLabel("Site Office - Plot 42, Jagatpura")}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-700 text-xs font-bold rounded-[6px] border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Share Site Location
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-[6px] font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── SECTION 3: MILESTONE STAGES & DAILY LOGS ── */}
        {(activeTab === "stages" || activeTab === "logs") && (
          <div className="space-y-6 animate-fade-in">
            {/* Custom Milestone Creation Modal */}
            {showAddMilestoneModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[8px] max-w-lg w-full p-6 space-y-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[6px] bg-[#0f2744]/10 text-[#0f2744] flex items-center justify-center font-bold">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Add Custom Project Milestone</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Create a custom stage tailored to your specific workflow</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddMilestoneModal(false)}
                      className="text-slate-400 hover:text-slate-700 p-1.5 rounded-[4px] hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateCustomMilestone} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Milestone Stage Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Electrical Rough-in & Circuit Testing"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-[#0f2744] focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Description / Deliverables Scope</label>
                      <textarea
                        rows={3}
                        placeholder="Detail specific tasks, materials included, or inspection criteria..."
                        value={newMilestoneDesc}
                        onChange={(e) => setNewMilestoneDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-[#0f2744] focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Cost / Budget Allocation (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 25000"
                          value={newMilestoneCost}
                          onChange={(e) => setNewMilestoneCost(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-[#0f2744] focus:bg-white transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Target Date</label>
                        <input
                          type="date"
                          value={newMilestoneDeadline}
                          onChange={(e) => setNewMilestoneDeadline(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-[6px] px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:border-[#0f2744] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddMilestoneModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-[6px] transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={actionProcessing === "createMilestone"}
                        className="px-5 py-2 bg-[#0f2744] hover:bg-[#1e3a8a] text-white font-extrabold text-xs uppercase tracking-wider rounded-[6px] transition cursor-pointer shadow-subtle"
                      >
                        {actionProcessing === "createMilestone" ? "Creating..." : "Save Custom Milestone"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Header with Add Custom Milestone Action */}
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] space-y-5 shadow-subtle">
              <div className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0f2744]" /> Milestone & Workflow Stage Stepper
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Strict 2-Way Confirmation Gate (Contractor + Customer Signoff required)</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(true)}
                  className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-extrabold px-4 py-2.5 rounded-[6px] text-xs uppercase tracking-wider transition shadow-subtle flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Custom Milestone
                </button>
              </div>

              <div className="space-y-5">
                {filteredMilestones.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-[8px] border border-dashed border-slate-200 space-y-3">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-bold">No custom milestones created for this stage yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddMilestoneModal(true)}
                      className="text-xs font-extrabold text-[#0f2744] hover:underline"
                    >
                      + Create First Milestone
                    </button>
                  </div>
                ) : (
                  filteredMilestones.map((m, idx) => {
                    const isDone = m.status === "completed";
                    const isProApproved = !!m.proApproved || !!m.completionRequestedAt;
                    const isClientApproved = !!m.clientApproved;
                    const tasksList = m.tasks || [];
                    const completedTasksCount = tasksList.filter((t) => t.completed).length;

                    return (
                      <div key={m.id} className="bg-slate-50/70 border border-slate-200 p-5 rounded-[8px] space-y-4 transition hover:border-slate-300">
                        {/* Milestone Header */}
                        <div className="flex justify-between items-start flex-wrap gap-2 border-b border-slate-200/80 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">Stage #{m.order || idx + 1}: {m.title}</span>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-wider border ${
                                isDone ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                              }`}>
                                {isDone ? "✓ Completed & Verified" : "In Progress"}
                              </span>
                              {m.cost && m.cost > 0 ? (
                                <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-[4px]">
                                  💰 ₹{m.cost.toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                            {m.description && (
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">{m.description}</p>
                            )}
                          </div>

                          {(isProApproved && isClientApproved) || isDone ? (
                            <span
                              className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-[6px] flex items-center gap-1 shadow-xs shrink-0"
                              title="Locked: Milestone verified and accepted by both sides"
                            >
                              <span>🔒 Locked (Accepted Both Sides)</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(m.id)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-[4px] hover:bg-rose-50 transition shrink-0"
                              title="Delete Milestone"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* 2-Way Handshake Confirmation Indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                          <div className={`p-3 rounded-[6px] border flex items-center justify-between ${isProApproved ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-slate-800" />
                              <span>1. Contractor Inspection</span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-[4px] ${isProApproved ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                              {isProApproved ? "✓ Confirmed" : "Pending"}
                            </span>
                          </div>

                          <div className={`p-3 rounded-[6px] border flex items-center justify-between ${isClientApproved ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" : "bg-white border-slate-200 text-slate-600"}`}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              <span>2. Customer Verification</span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-[4px] ${isClientApproved ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                              {isClientApproved ? "✓ Verified" : "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* Handshake Action Buttons */}
                        <div className="pt-1">
                          {/* Contractor Action Button */}
                          {isBusiness && !isProApproved && !isDone && (
                            <button
                              disabled={actionProcessing === m.id}
                              onClick={() => handleRequestMilestoneInspection(m)}
                              className="bg-[#0f2744] hover:bg-[#1e3a8a] border border-[#1e3e66] text-white font-bold px-4 py-2 rounded-[6px] text-xs uppercase tracking-wider transition shadow-subtle cursor-pointer"
                            >
                              ✓ Confirm Contractor Inspection Complete
                            </button>
                          )}

                          {/* Customer Action Button */}
                          {isClient && isProApproved && !isClientApproved && (
                            <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-[6px] space-y-3">
                              <span className="text-xs font-bold text-amber-900 block">
                                Contractor has marked inspection completed. Please verify physical site work:
                              </span>
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  disabled={actionProcessing === m.id}
                                  onClick={() => handleApproveMilestone(m)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-[6px] text-xs uppercase tracking-wider transition shadow-subtle cursor-pointer"
                                >
                                  Verify & Approve Stage Completion ✓
                                </button>
                                <button
                                  disabled={actionProcessing === m.id}
                                  onClick={() => setRejectingMilestoneId(m.id)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-2 rounded-[6px] text-xs transition cursor-pointer shadow-subtle"
                                >
                                  Reject / Request Rework
                                </button>
                              </div>

                              {rejectingMilestoneId === m.id && (
                                <div className="pt-2 space-y-2">
                                  <input
                                    type="text"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="State reason e.g. Electrical outlet height incorrect"
                                    className="w-full bg-white border border-slate-300 rounded-[6px] p-2.5 text-xs text-slate-900"
                                  />
                                  <button
                                    onClick={() => handleRejectMilestone(m)}
                                    className="bg-rose-600 text-white px-4 py-1.5 rounded-[4px] text-xs font-bold cursor-pointer"
                                  >
                                    Submit Rework Request
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Contractor awaiting customer signoff indicator */}
                          {isBusiness && isProApproved && !isClientApproved && (
                            <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-[6px] text-xs text-amber-900 font-semibold flex justify-between items-center flex-wrap gap-2">
                              <span>⌛ Inspection request submitted. Customer signoff required from customer account.</span>
                              <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-[4px] border border-amber-200">
                                Awaiting Customer Approval
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Custom Tasks Checklist Sub-section */}
                        <div className="pt-3 border-t border-slate-200/80 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Custom Milestone Checklist Tasks ({completedTasksCount}/{tasksList.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddTaskMilestoneId(addTaskMilestoneId === m.id ? null : m.id)}
                              className="text-xs font-bold text-[#0f2744] hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Sub-task
                            </button>
                          </div>

                          {/* Inline Add Task Form */}
                          {addTaskMilestoneId === m.id && (
                            <div className="flex items-center gap-2 bg-white p-2 rounded-[6px] border border-slate-300">
                              <input
                                type="text"
                                placeholder="Enter custom task item title..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="flex-1 text-xs text-slate-900 font-medium outline-none px-2 py-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddTaskToMilestone(m);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddTaskToMilestone(m)}
                                className="bg-[#0f2744] hover:bg-[#1e3a8a] text-white px-3 py-1 rounded-[4px] text-xs font-bold cursor-pointer"
                              >
                                Save Task
                              </button>
                            </div>
                          )}

                          {/* Tasks List */}
                          {tasksList.length === 0 ? (
                            <p className="text-[11px] text-slate-400 font-medium italic">No custom checklist tasks added yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {tasksList.map((t) => (
                                <div key={t.id} className="flex items-center justify-between bg-white p-2.5 rounded-[6px] border border-slate-200 text-xs hover:border-slate-300 transition">
                                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={t.completed}
                                      onChange={() => handleToggleTask(m, t.id)}
                                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className={`font-semibold ${t.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                                      {t.title}
                                    </span>
                                    {t.completedBy && (
                                      <span className="text-[10px] text-slate-400 font-medium">({t.completedBy})</span>
                                    )}
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(m, t.id)}
                                    className="text-slate-300 hover:text-rose-500 p-1 transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 4: FINANCIALS & ESCROW ── */}
        {activeTab === "financials" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 p-6 rounded-[8px] space-y-5 shadow-subtle">
              <div className="border-b border-slate-100 pb-3.5">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Project Financials & Escrow Ledger</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Budget allocations, payment requests, escrow releases & receipts</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Total Budget</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">₹{totalBudgetVal.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Escrow Released</span>
                  <span className="text-base font-black text-emerald-600 mt-0.5 block">₹{totalPaid.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Locked Escrow</span>
                  <span className="text-base font-black text-indigo-600 mt-0.5 block">₹{lockedEscrow.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Upcoming Requests</span>
                  <span className="text-base font-black text-rose-600 mt-0.5 block">₹{pendingPaymentsAmount.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Retention (5%)</span>
                  <span className="text-base font-black text-amber-600 mt-0.5 block">₹{retentionAmount.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-[6px] text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Extra Change Orders</span>
                  <span className="text-base font-black text-purple-600 mt-0.5 block">₹{extraRequestsAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Requests Ledger */}
              <div className="space-y-2.5 pt-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">Payment Request Queue</h4>
                {filteredPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold py-6 text-center">No payment requests for this stage.</p>
                ) : (
                  filteredPayments.map((pReq) => (
                    <div key={pReq.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{pReq.description}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">Requested: ₹{pReq.amount.toLocaleString()}</span>
                      </div>
                      {isClient && pReq.status === "pending" ? (
                        <button
                          disabled={actionProcessing === pReq.id}
                          onClick={() => handleRespondPaymentRequest(pReq, "approved")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-[6px] text-xs uppercase tracking-wider transition cursor-pointer shadow-xs"
                        >
                          Approve Payment & Release
                        </button>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-[4px] border ${
                          pReq.status === "approved" || pReq.status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {pReq.status}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 5: CATEGORIZED DOCUMENTS ── */}
        {activeTab === "documents" && (
          <div className="bg-white border border-slate-200 p-6 rounded-[8px] space-y-5 animate-fade-in shadow-subtle">
            <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Categorized Document Vault</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Architectural blueprints, contracts, invoices, warranties & inspection certificates</p>
              </div>
            </div>

            {/* Document Upload Form */}
            <form onSubmit={handleDocumentUploadSubmit} className="bg-slate-50 p-4 rounded-[6px] border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Document Title e.g. Site Plan v3"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none"
                />
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-[6px] px-3 py-2 text-xs text-slate-900 outline-none font-medium"
                >
                  <option value="blueprint">Blueprint / Architecture</option>
                  <option value="agreement">Contract / Agreement</option>
                  <option value="quotation">Quotation / Proposal</option>
                  <option value="invoice">Invoice / Bill</option>
                  <option value="receipt">Payment Receipt</option>
                  <option value="warranty_card">Warranty Certificate</option>
                </select>
                <input
                  type="file"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="text-xs text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingDoc || !docFile}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-[6px] text-xs uppercase tracking-wider transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {uploadingDoc ? "Vaulting Document..." : "Vault Document"}
              </button>
            </form>

            {/* Documents List */}
            <div className="space-y-2.5">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Category: {doc.type.toUpperCase()} · v{doc.version || 1}</span>
                  </div>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-[6px] text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <FileDown className="w-4 h-4 text-slate-600" /> Download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION 6: TEAM ROSTER ── */}
        {activeTab === "team" && (
          <div className="bg-white border border-slate-200 p-6 rounded-[8px] space-y-5 animate-fade-in shadow-subtle">
            <div className="border-b border-slate-100 pb-3.5">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900">Project Site Team Roster</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Verified engineers, site supervisors, and assigned professionals</p>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs space-y-1">
                <Users className="w-8 h-8 opacity-30 mx-auto mb-2 text-slate-400" />
                <p>No site team members added to roster yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teamMembers.map((tm) => (
                  <div key={tm.id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-[6px] flex items-center gap-3">
                    <img src={tm.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"} alt="" className="w-10 h-10 rounded-[6px] object-cover border border-slate-200" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{tm.name}</span>
                      <span className="text-[10px] text-indigo-700 font-bold block">{tm.role}</span>
                      {tm.assignedWork && <span className="text-[9.5px] text-slate-500 block mt-0.5">Assigned: {tm.assignedWork}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* AI Assistant Scoped to Real Project Events */}
      {project && (
        <WorkspaceAiAssistant
          project={project}
          events={events}
          milestones={milestones}
          dailyLogs={dailyLogs}
          documents={documents}
          paymentRequests={paymentRequests}
          warranty={warranty}
          actorRole={actorRole}
        />
      )}

      <Footer />
    </div>
  );
}
