"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import { triggerNotification } from "@/lib/notifications";
import { compressImageToBase64 } from "@/lib/imageUtils";
import {
  Project,
  Milestone,
  DailyLog,
  ProjectMedia,
  ProjectDocument,
  MaterialEntry,
  ProjectTeamMember,
  PaymentRequest,
  ProjectWarranty
} from "@/lib/schema";
import {
  Briefcase,
  ChevronLeft,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Upload,
  Users,
  Award,
  ExternalLink,
  Wrench,
  Camera,
  X,
  ChevronRight,
  ShieldCheck,
  Send,
  Trash2
} from "lucide-react";

export default function ProfessionalProjectsDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Active Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Project for Modals
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<
    "none" | "dailyLog" | "milestoneReq" | "paymentReq" | "material" | "team" | "document" | "warranty"
  >("none");

  // Sub-data for selected project
  const [modalMilestones, setModalMilestones] = useState<Milestone[]>([]);
  const [modalTeam, setModalTeam] = useState<ProjectTeamMember[]>([]);

  // Form States for Modals
  const [submitting, setSubmitting] = useState(false);

  // Daily Log Form State
  const [logWorkers, setLogWorkers] = useState(2);
  const [logHours, setLogHours] = useState(8);
  const [logSummaryBullets, setLogSummaryBullets] = useState<string[]>(["Completed electrical rough-in"]);
  const [newBulletText, setNewBulletText] = useState("");
  const [logIssues, setLogIssues] = useState("");
  const [logTomorrow, setLogTomorrow] = useState("");
  const [logOverallPercent, setLogOverallPercent] = useState<number>(0);
  const [logMediaFile, setLogMediaFile] = useState<File | null>(null);
  const [logMediaCaption, setLogMediaCaption] = useState("");

  // Payment Request Form State
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payDesc, setPayDesc] = useState("");
  const [payMilestoneId, setPayMilestoneId] = useState("");

  // Material Entry Form State
  const [matItem, setMatItem] = useState("");
  const [matQty, setMatQty] = useState(1);
  const [matUnit, setMatUnit] = useState("bags");
  const [matCost, setMatCost] = useState(5000);
  const [matBillFile, setMatBillFile] = useState<File | null>(null);

  // Team Member Form State
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("Site Supervisor");
  const [teamCount, setTeamCount] = useState(1);
  const [teamLinkedUser, setTeamLinkedUser] = useState("");

  // Document Upload Form State
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<ProjectDocument["type"]>("blueprint");
  const [docFile, setDocFile] = useState<File | null>(null);

  // Warranty & Completion Form State
  const [finalCostVal, setFinalCostVal] = useState<number>(0);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [warrantyCoverage, setWarrantyCoverage] = useState("Complete workmanship coverage for electrical & plumbing installations.");
  const [warrantyDocFile, setWarrantyDocFile] = useState<File | null>(null);

  // 1. Fetch Active Projects assigned to professional
  useEffect(() => {
    if (!user) {
      if (!authLoading) setLoading(false);
      return;
    }

    // Query projects where businessId matches pro uid
    const q = query(
      collection(db, "projects"),
      where("businessId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: Project[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Project);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching pro projects:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // Load sub-data when modal opens for a project
  const openProjectModal = async (
    pId: string,
    modalType: "dailyLog" | "milestoneReq" | "paymentReq" | "material" | "team" | "document" | "warranty"
  ) => {
    setSelectedProjectId(pId);
    setActiveModal(modalType);

    const targetProj = projects.find((p) => p.id === pId);
    if (targetProj) {
      setLogOverallPercent(targetProj.progressPercent || 0);
      setFinalCostVal(targetProj.estimatedCost || 50000);
    }

    // Fetch milestones for this project
    try {
      const msSnap = await getDocs(query(collection(db, "milestones"), where("projectId", "==", pId)));
      const msList: Milestone[] = [];
      msSnap.forEach((d) => msList.push({ id: d.id, ...d.data() } as Milestone));
      setModalMilestones(msList);

      // Fetch team members
      const tmSnap = await getDocs(query(collection(db, "projectTeam"), where("projectId", "==", pId)));
      const tmList: ProjectTeamMember[] = [];
      tmSnap.forEach((d) => tmList.push({ id: d.id, ...d.data() } as ProjectTeamMember));
      setModalTeam(tmList);
    } catch (err) {
      console.error("Error fetching project modal data:", err);
    }
  };

  // Close Modal Reset
  const closeModal = () => {
    setActiveModal("none");
    setSelectedProjectId(null);
    setSubmitting(false);
  };

  // ── SUBMIT HANDLERS ──

  // 1. Submit Daily Progress Log
  const handleDailyLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;
    setSubmitting(true);

    try {
      const proj = projects.find((p) => p.id === selectedProjectId);
      const todayStr = new Date().toISOString().split("T")[0];
      const nowStr = new Date().toISOString();

      // Submit Daily Log Doc
      const logData: any = {
        projectId: selectedProjectId,
        date: todayStr,
        workersPresent: logWorkers,
        hoursWorked: logHours,
        workSummary: logSummaryBullets,
        completionPercentToday: 5,
        overallCompletionPercent: logOverallPercent,
        submittedBy: user.uid,
        createdAt: nowStr
      };
      if (logIssues.trim()) logData.issues = logIssues.trim();
      if (logTomorrow.trim()) logData.tomorrowPlan = logTomorrow.trim();

      await addDoc(collection(db, "dailyLogs"), logData);

      // Upload Site Media if file provided
      if (logMediaFile) {
        let fileUrl = "";
        try {
          const storageRef = ref(storage, `projectMedia/${selectedProjectId}/${Date.now()}_${logMediaFile.name}`);
          await uploadBytes(storageRef, logMediaFile);
          fileUrl = await getDownloadURL(storageRef);
        } catch (err) {
          // Fallback image compression base64
          fileUrl = await compressImageToBase64(logMediaFile);
        }

        const mediaData: Omit<ProjectMedia, "id"> = {
          projectId: selectedProjectId,
          type: logMediaFile.type.startsWith("video") ? "video" : "image",
          url: fileUrl,
          caption: logMediaCaption || `Daily progress photo - ${todayStr}`,
          uploadedBy: user.uid,
          uploadedByName: user.displayName || "Contractor",
          createdAt: nowStr
        };
        await addDoc(collection(db, "projectMedia"), mediaData);
      }

      // Update Project Progress & Stage
      await updateDoc(doc(db, "projects", selectedProjectId), {
        progressPercent: logOverallPercent,
        currentStage: logSummaryBullets[0] || proj?.currentStage || "Site Work"
      });

      // Workspace Chat System Entry
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        projectId: selectedProjectId,
        senderId: "system",
        senderName: "System Audit",
        text: `📋 Daily Progress Log submitted: ${logWorkers} workers, ${logHours} hrs. Progress: ${logOverallPercent}%.`,
        createdAt: nowStr
      });

      // Trigger Notification to Client
      if (proj?.clientId) {
        await triggerNotification(
          proj.clientId,
          "Daily Progress Log Updated",
          `${user.displayName || "Contractor"} uploaded today's site progress log (${logOverallPercent}% total completion).`,
          "booking"
        );
      }

      closeModal();
    } catch (err) {
      console.error("Error submitting daily log:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Request Milestone Completion Inspection
  const handleRequestMilestoneInspection = async (mId: string) => {
    if (!selectedProjectId || !user) return;
    setSubmitting(true);
    try {
      const nowStr = new Date().toISOString();
      const proj = projects.find((p) => p.id === selectedProjectId);
      const milestoneObj = modalMilestones.find((m) => m.id === mId);

      const isBothApproved = !!milestoneObj?.clientApproved;
      const newStatus = isBothApproved ? "completed" : "in_progress";

      await updateDoc(doc(db, "milestones", mId), {
        proApproved: true,
        proApprovedAt: nowStr,
        completionRequestedAt: nowStr,
        status: newStatus
      });

      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        projectId: selectedProjectId,
        senderId: "system",
        senderName: "System Audit",
        text: `🚩 Contractor requested client inspection for milestone: "${milestoneObj?.title || "Milestone"}".`,
        createdAt: nowStr
      });

      if (proj?.clientId) {
        await triggerNotification(
          proj.clientId,
          "Milestone Completion Requested",
          `${user.displayName || "Contractor"} marked "${milestoneObj?.title}" ready for inspection. Please review and approve.`,
          "booking"
        );
      }

      closeModal();
    } catch (err) {
      console.error("Error requesting milestone inspection:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Create Payment Request
  const handlePaymentRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;
    setSubmitting(true);

    try {
      const nowStr = new Date().toISOString();
      const proj = projects.find((p) => p.id === selectedProjectId);

      const reqData: any = {
        projectId: selectedProjectId,
        amount: payAmount,
        description: payDesc || "Milestone Payment",
        status: "pending",
        requestedBy: user.uid,
        requestedAt: nowStr
      };
      if (payMilestoneId) reqData.milestoneId = payMilestoneId;

      await addDoc(collection(db, "paymentRequests"), reqData);

      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        projectId: selectedProjectId,
        senderId: "system",
        senderName: "System Audit",
        text: `💰 Payment Request created: ₹${payAmount.toLocaleString()} for "${payDesc}".`,
        createdAt: nowStr
      });

      if (proj?.clientId) {
        await triggerNotification(
          proj.clientId,
          "Payment Requested",
          `${user.displayName || "Contractor"} requested a milestone payment of ₹${payAmount.toLocaleString()}.`,
          "payment"
        );
      }

      closeModal();
    } catch (err) {
      console.error("Error submitting payment request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Add Material Entry
  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;
    setSubmitting(true);

    try {
      let billUrl = "";
      if (matBillFile) {
        try {
          const storageRef = ref(storage, `materials/${selectedProjectId}/${Date.now()}_${matBillFile.name}`);
          await uploadBytes(storageRef, matBillFile);
          billUrl = await getDownloadURL(storageRef);
        } catch (err) {
          billUrl = await compressImageToBase64(matBillFile);
        }
      }

      const matData: any = {
        projectId: selectedProjectId,
        itemName: matItem,
        quantity: matQty,
        unit: matUnit,
        cost: matCost,
        purchasedAt: new Date().toISOString().split("T")[0],
        addedBy: user.uid
      };
      if (billUrl) matData.billUrl = billUrl;

      await addDoc(collection(db, "materialEntries"), matData);
      closeModal();
    } catch (err) {
      console.error("Error adding material entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Add Team Member
  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;
    setSubmitting(true);

    try {
      const teamData: any = {
        projectId: selectedProjectId,
        name: teamName,
        role: teamRole,
        count: teamCount,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
      };
      if (teamLinkedUser.trim()) teamData.linkedUserId = teamLinkedUser.trim();

      await addDoc(collection(db, "projectTeam"), teamData);
      closeModal();
    } catch (err) {
      console.error("Error adding team member:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Upload Project Document
  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user || !docFile) return;
    setSubmitting(true);

    try {
      let fileUrl = "";
      try {
        const storageRef = ref(storage, `projectDocuments/${selectedProjectId}/${Date.now()}_${docFile.name}`);
        await uploadBytes(storageRef, docFile);
        fileUrl = await getDownloadURL(storageRef);
      } catch (err) {
        fileUrl = await compressImageToBase64(docFile);
      }

      const docData: Omit<ProjectDocument, "id"> = {
        projectId: selectedProjectId,
        type: docType,
        name: docName || docFile.name,
        fileUrl,
        uploadedBy: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "projectDocuments"), docData);
      closeModal();
    } catch (err) {
      console.error("Error uploading document:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Complete Project & Issue Warranty
  const handleCompleteProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !user) return;
    setSubmitting(true);

    try {
      const nowStr = new Date().toISOString();
      const proj = projects.find((p) => p.id === selectedProjectId);

      let certUrl = "";
      if (warrantyDocFile) {
        try {
          const storageRef = ref(storage, `warranties/${selectedProjectId}/${Date.now()}_${warrantyDocFile.name}`);
          await uploadBytes(storageRef, warrantyDocFile);
          certUrl = await getDownloadURL(storageRef);
        } catch (err) {
          certUrl = await compressImageToBase64(warrantyDocFile);
        }
      }

      // Create Warranty Doc
      const wData: any = {
        projectId: selectedProjectId,
        businessId: user.uid,
        durationMonths: warrantyMonths,
        coverage: warrantyCoverage,
        issuedAt: nowStr
      };
      if (certUrl) wData.documentUrl = certUrl;
      const wDocRef = await addDoc(collection(db, "warranties"), wData);

      // Create Completion Certificate Doc in projectDocuments
      if (certUrl) {
        await addDoc(collection(db, "projectDocuments"), {
          projectId: selectedProjectId,
          type: "completion_certificate",
          name: `Completion_Certificate_${proj?.title || "Job"}.pdf`,
          fileUrl: certUrl,
          uploadedBy: user.uid,
          createdAt: nowStr
        });
      }

      // Mark Project Completed
      await updateDoc(doc(db, "projects", selectedProjectId), {
        status: "completed",
        progressPercent: 100,
        completedAt: nowStr,
        finalCost: finalCostVal,
        warrantyId: wDocRef.id
      });

      // System Workspace Audit Message
      await addDoc(collection(db, "projects", selectedProjectId, "messages"), {
        projectId: selectedProjectId,
        senderId: "system",
        senderName: "System Audit",
        text: `🏆 PROJECT COMPLETED! Handover finished, final cost ₹${finalCostVal.toLocaleString()}, ${warrantyMonths}-month warranty issued.`,
        createdAt: nowStr
      });

      if (proj?.clientId) {
        await triggerNotification(
          proj.clientId,
          "Project Completed & Warranty Issued!",
          `Congratulations! Your project "${proj.title}" is marked complete with an official ${warrantyMonths}-month warranty certificate.`,
          "booking"
        );
      }

      closeModal();
    } catch (err) {
      console.error("Error completing project:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-32 text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-250 flex items-center justify-center mx-auto shadow-xl">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-slate-500 text-sm">Please sign in as a verified professional to access active job management.</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* ── MODALS FOR OPERATIONAL ACTIONS ── */}
      {activeModal !== "none" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative my-8">
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* MODAL 1: Update Daily Progress */}
            {activeModal === "dailyLog" && (
              <form onSubmit={handleDailyLogSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Update Daily Site Progress</h3>
                  <p className="text-xs text-slate-500 font-medium">Record site workforce, hours & progress bullets</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Workers Present</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={logWorkers}
                      onChange={(e) => setLogWorkers(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Hours Worked</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={logHours}
                      onChange={(e) => setLogHours(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Overall Completion % Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500 uppercase text-[10px]">Updated Job Completion %</span>
                    <span className="text-indigo-600">{logOverallPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={logOverallPercent}
                    onChange={(e) => setLogOverallPercent(parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Work Summary Bullets */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Work Completed Today (Bullets)</label>
                  <div className="space-y-1.5">
                    {logSummaryBullets.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg text-xs font-medium text-slate-800 border border-slate-150">
                        <span className="flex-1">• {b}</span>
                        <button
                          type="button"
                          onClick={() => setLogSummaryBullets(logSummaryBullets.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add bullet line e.g. Installed 14 switch boxes"
                      value={newBulletText}
                      onChange={(e) => setNewBulletText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBulletText.trim()) {
                          setLogSummaryBullets([...logSummaryBullets, newBulletText.trim()]);
                          setNewBulletText("");
                        }
                      }}
                      className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Site Issues / Blockers (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Waiting for client tile selection"
                    value={logIssues}
                    onChange={(e) => setLogIssues(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Tomorrow's Plan (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Grouting bathroom tiles"
                    value={logTomorrow}
                    onChange={(e) => setLogTomorrow(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                {/* Upload Photo/Video */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Attach Site Photo / Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setLogMediaFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                  >
                    {submitting ? "Publishing Log..." : "Publish Site Daily Log"}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL 2: Request Milestone Inspection */}
            {activeModal === "milestoneReq" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Request Milestone Inspection</h3>
                  <p className="text-xs text-slate-500 font-medium">Select a completed milestone to send client for approval</p>
                </div>

                {modalMilestones.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No milestones created for this project yet.</p>
                ) : (
                  <div className="space-y-2">
                    {modalMilestones.map((m) => (
                      <div key={m.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-xs text-slate-900 block">{m.title}</span>
                          <span className="text-[10px] text-slate-500">Status: {m.status}</span>
                        </div>
                        {m.status !== "completed" && (
                          <button
                            disabled={submitting}
                            onClick={() => handleRequestMilestoneInspection(m.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Request Inspection
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MODAL 3: Create Payment Request */}
            {activeModal === "paymentReq" && (
              <form onSubmit={handlePaymentRequestSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Request Milestone Payment</h3>
                  <p className="text-xs text-slate-500 font-medium">Send payment request directly to client workspace</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Description / Milestone Phase</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stage 2 Masonry & Plastering Payment"
                    value={payDesc}
                    onChange={(e) => setPayDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                  >
                    {submitting ? "Sending Request..." : "Send Payment Request"}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL 4: Add Material Entry */}
            {activeModal === "material" && (
              <form onSubmit={handleMaterialSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Log Material Purchase</h3>
                  <p className="text-xs text-slate-500 font-medium">Add itemized site material expenses with bill proof</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultratech Cement Bags"
                    value={matItem}
                    onChange={(e) => setMatItem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Quantity & Unit</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={matQty}
                        onChange={(e) => setMatQty(parseInt(e.target.value) || 1)}
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="bags"
                        value={matUnit}
                        onChange={(e) => setMatUnit(e.target.value)}
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Cost (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={matCost}
                      onChange={(e) => setMatCost(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Attach Bill Receipt Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setMatBillFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                  >
                    {submitting ? "Saving Entry..." : "Save Material Entry"}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL 5: Manage Project Team */}
            {activeModal === "team" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Project Team Roster</h3>
                  <p className="text-xs text-slate-500 font-medium">Assign engineers & technicians to site</p>
                </div>

                {/* Team Roster List */}
                <div className="space-y-2">
                  {modalTeam.map((tm) => (
                    <div key={tm.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 block">{tm.name}</span>
                        <span className="text-[10px] text-slate-500">{tm.role} {tm.count ? `(${tm.count})` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Member Form */}
                <form onSubmit={handleAddTeamMember} className="border-t border-slate-100 pt-4 space-y-3">
                  <span className="text-xs font-black text-slate-900 block uppercase tracking-wider">Add Team Member</span>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Name / Title"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Role (e.g. Electrician x4)"
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs uppercase"
                  >
                    Add to Roster
                  </button>
                </form>
              </div>
            )}

            {/* MODAL 6: Upload Document */}
            {activeModal === "document" && (
              <form onSubmit={handleDocumentSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Upload Project Document</h3>
                  <p className="text-xs text-slate-500 font-medium">Add blueprints, GST bills, agreements to vault</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Approved Structural Blueprint v2"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e: any) => setDocType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="blueprint">Blueprint / Design</option>
                    <option value="agreement">Signed Agreement</option>
                    <option value="gst_bill">GST Tax Bill</option>
                    <option value="quotation">Quotation / Bid</option>
                    <option value="invoice">Payment Invoice</option>
                    <option value="other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Select File</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                  >
                    {submitting ? "Uploading Document..." : "Upload Document"}
                  </button>
                </div>
              </form>
            )}

            {/* MODAL 7: Complete Project & Issue Warranty */}
            {activeModal === "warranty" && (
              <form onSubmit={handleCompleteProject} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Complete Job & Issue Guarantee</h3>
                  <p className="text-xs text-slate-500 font-medium">Finalize handover and issue official warranty certificate</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Final Project Cost (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={finalCostVal}
                    onChange={(e) => setFinalCostVal(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Warranty Duration (Months)</label>
                  <select
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value={6}>6 Months Workmanship Guarantee</option>
                    <option value={12}>12 Months Full Warranty</option>
                    <option value={24}>24 Months Extended Warranty</option>
                    <option value={36}>36 Months Premium Warranty</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Coverage Terms</label>
                  <textarea
                    rows={3}
                    required
                    value={warrantyCoverage}
                    onChange={(e) => setWarrantyCoverage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Upload Handover / Warranty PDF (Optional)</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setWarrantyDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md"
                  >
                    {submitting ? "Processing Handover..." : "✓ Verify Completion & Issue Warranty"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-5 pt-28 pb-20">
        
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Operational Dashboard Title Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-150">
              Contractor Command Center
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Active Projects & Site Operations</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Publish daily progress logs, request milestone inspection approvals, log materials, and issue completion warranties.
            </p>
          </div>

          <Link
            href="/projects/create"
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" /> Create New Brief
          </Link>
        </div>

        {/* ── SECTION 1: DAILY OPERATIONAL TASK LIST ── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-10 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Daily Operations Task Checklist</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => {
              const isComp = p.status === "completed";
              if (isComp) return null;

              return (
                <div key={p.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-extrabold text-xs text-slate-900 block truncate">{p.title}</span>
                    <span className="text-[9.5px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {p.progressPercent || 0}%
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-semibold text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>• Publish Today's Daily Log</span>
                      <button
                        onClick={() => openProjectModal(p.id, "dailyLog")}
                        className="text-[10px] font-black text-indigo-600 hover:underline uppercase"
                      >
                        Upload
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Request Milestone Inspection</span>
                      <button
                        onClick={() => openProjectModal(p.id, "milestoneReq")}
                        className="text-[10px] font-black text-indigo-600 hover:underline uppercase"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 2: ACTIVE PROJECTS GRID ── */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">Active Customer Workspaces</h3>

          {projects.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
              <p className="text-slate-500 text-sm font-bold">No active assigned projects found.</p>
              <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                When clients accept your quotations or assign projects to your business account, they will populate here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => {
                const isComp = proj.status === "completed";

                return (
                  <div
                    key={proj.id}
                    className="border border-slate-200 rounded-3xl p-6 bg-white shadow-xs hover:shadow-md transition space-y-5 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex justify-between items-start gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isComp
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}>
                          {isComp ? "Completed" : `Stage: ${proj.currentStage || "Active"}`}
                        </span>
                        <span className="text-xs font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                          {proj.progressPercent || 0}% Progress
                        </span>
                      </div>

                      {/* Title & Customer */}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-snug">{proj.title}</h4>
                        <span className="text-xs font-bold text-slate-450 block mt-1">Client: {proj.clientName}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${proj.progressPercent || 0}%` }} />
                      </div>
                    </div>

                    {/* Operational Action Toolbar */}
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10.5px] font-bold">
                        <button
                          onClick={() => openProjectModal(proj.id, "dailyLog")}
                          className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl transition text-center"
                        >
                          + Daily Log
                        </button>
                        <button
                          onClick={() => openProjectModal(proj.id, "milestoneReq")}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 py-2.5 rounded-xl transition text-center"
                        >
                          Request Inspect
                        </button>
                        <button
                          onClick={() => openProjectModal(proj.id, "paymentReq")}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl transition text-center"
                        >
                          + Request Pay
                        </button>
                        <button
                          onClick={() => openProjectModal(proj.id, "material")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl transition text-center"
                        >
                          + Material Bill
                        </button>
                        <button
                          onClick={() => openProjectModal(proj.id, "team")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl transition text-center"
                        >
                          Roster Team
                        </button>
                        <button
                          onClick={() => openProjectModal(proj.id, "document")}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl transition text-center"
                        >
                          Vault Doc
                        </button>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {!isComp && (
                          <button
                            onClick={() => openProjectModal(proj.id, "warranty")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition text-center shadow-xs"
                          >
                            ✓ Finish & Issue Warranty
                          </button>
                        )}
                        <Link
                          href={`/workspace/${proj.id}`}
                          className="px-4 py-2.5 bg-[#0f2744] hover:bg-[#1e3a8a] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0 shadow-subtle"
                        >
                          <span>⚡ Open Workspace Hub</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
