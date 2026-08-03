import { db } from "./firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Milestone, DailyLog, ProjectDocument, PaymentRequest } from "./schema";

export interface ProjectTrustDetails {
  score: number;
  label: "Exceptional" | "Reliable" | "On Track" | "Needs Attention";
  breakdown: {
    onTimeDelivery: { score: number; max: 25 };
    dailyReporting: { score: number; max: 25 };
    communicationResponsiveness: { score: number; max: 20 };
    approvalSpeed: { score: number; max: 15 };
    documentCompleteness: { score: number; max: 15 };
  };
}

/**
 * Recalculates and stores project-level trust score on the Project document.
 */
export async function recalculateProjectTrust(projectId: string): Promise<ProjectTrustDetails> {
  if (!projectId) {
    return {
      score: 100,
      label: "On Track",
      breakdown: {
        onTimeDelivery: { score: 25, max: 25 },
        dailyReporting: { score: 25, max: 25 },
        communicationResponsiveness: { score: 20, max: 20 },
        approvalSpeed: { score: 15, max: 15 },
        documentCompleteness: { score: 15, max: 15 }
      }
    };
  }

  try {
    // 1. Fetch Milestones
    const qM = query(collection(db, "milestones"), where("projectId", "==", projectId));
    const snapM = await getDocs(qM);
    const milestones: Milestone[] = [];
    snapM.forEach((d) => milestones.push({ id: d.id, ...d.data() } as Milestone));

    // 2. Fetch Daily Logs
    const qL = query(collection(db, "dailyLogs"), where("projectId", "==", projectId));
    const snapL = await getDocs(qL);
    const dailyLogs: DailyLog[] = [];
    snapL.forEach((d) => dailyLogs.push({ id: d.id, ...d.data() } as DailyLog));

    // 3. Fetch Documents
    const qD = query(collection(db, "projectDocuments"), where("projectId", "==", projectId));
    const snapD = await getDocs(qD);
    const documents: ProjectDocument[] = [];
    snapD.forEach((d) => documents.push({ id: d.id, ...d.data() } as ProjectDocument));

    // 4. Fetch Payment Requests
    const qP = query(collection(db, "paymentRequests"), where("projectId", "==", projectId));
    const snapP = await getDocs(qP);
    const paymentRequests: PaymentRequest[] = [];
    snapP.forEach((d) => paymentRequests.push({ id: d.id, ...d.data() } as PaymentRequest));

    // --- SCORE CALCULATIONS ---

    // A. On-Time Delivery (25 pts)
    let onTimeScore = 25;
    if (milestones.length > 0) {
      let overdueCount = 0;
      const now = new Date().getTime();
      milestones.forEach((m) => {
        if (m.status !== "completed" && m.deadline) {
          if (new Date(m.deadline).getTime() < now) {
            overdueCount++;
          }
        }
      });
      onTimeScore = Math.max(0, 25 - overdueCount * 8);
    }

    // B. Daily Reporting Consistency (25 pts)
    let dailyScore = Math.min(25, dailyLogs.length * 5);

    // C. Communication Responsiveness (20 pts)
    const commScore = 20; // Default high baseline

    // D. Approval Speed & Payment Reliability (15 pts)
    let approvalScore = 15;
    const rejectedPayments = paymentRequests.filter((p) => p.status === "rejected").length;
    approvalScore = Math.max(0, 15 - rejectedPayments * 5);

    // E. Document Completeness (15 pts)
    let docScore = 5;
    if (documents.some((d) => d.type === "agreement")) docScore += 3;
    if (documents.some((d) => d.type === "blueprint")) docScore += 3;
    if (documents.some((d) => d.type === "quotation" || d.type === "invoice")) docScore += 2;
    if (documents.some((d) => d.type === "warranty_card" || d.type === "completion_certificate")) docScore += 2;
    docScore = Math.min(15, docScore);

    const totalScore = Math.min(100, Math.max(0, onTimeScore + dailyScore + commScore + approvalScore + docScore));

    let label: ProjectTrustDetails["label"] = "On Track";
    if (totalScore >= 90) label = "Exceptional";
    else if (totalScore >= 75) label = "Reliable";
    else if (totalScore >= 60) label = "On Track";
    else label = "Needs Attention";

    const trustDetails: ProjectTrustDetails = {
      score: totalScore,
      label,
      breakdown: {
        onTimeDelivery: { score: onTimeScore, max: 25 },
        dailyReporting: { score: dailyScore, max: 25 },
        communicationResponsiveness: { score: commScore, max: 20 },
        approvalSpeed: { score: approvalScore, max: 15 },
        documentCompleteness: { score: docScore, max: 15 }
      }
    };

    // Update project doc in Firestore
    await updateDoc(doc(db, "projects", projectId), {
      projectTrustScore: totalScore,
      riskLevel: totalScore < 60 ? "high" : totalScore < 75 ? "medium" : "low"
    });

    return trustDetails;
  } catch (err) {
    console.error("Failed to recalculate project trust:", err);
    return {
      score: 85,
      label: "Reliable",
      breakdown: {
        onTimeDelivery: { score: 20, max: 25 },
        dailyReporting: { score: 20, max: 25 },
        communicationResponsiveness: { score: 20, max: 20 },
        approvalSpeed: { score: 12, max: 15 },
        documentCompleteness: { score: 13, max: 15 }
      }
    };
  }
}
