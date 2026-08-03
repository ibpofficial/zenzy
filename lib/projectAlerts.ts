import { Milestone, DailyLog, ProjectDocument, PaymentRequest, ProjectWarranty } from "./schema";

export interface ProjectAlert {
  id: string;
  type: "warning" | "urgent" | "info" | "success";
  title: string;
  message: string;
  actionTab?: "overview" | "timeline" | "progress" | "photos" | "payments" | "documents" | "materials" | "chat" | "team" | "warranty";
  createdAt: string;
}

export function generateProjectAlerts(
  milestones: Milestone[],
  dailyLogs: DailyLog[],
  documents: ProjectDocument[],
  paymentRequests: PaymentRequest[],
  warranty: ProjectWarranty | null
): ProjectAlert[] {
  const alerts: ProjectAlert[] = [];
  const nowMs = Date.now();

  // 1. Check for Pending Milestone Approval Requests
  const pendingMilestones = milestones.filter((m) => m.proApproved && !m.clientApproved);
  if (pendingMilestones.length > 0) {
    alerts.push({
      id: "alert-milestones-pending",
      type: "urgent",
      title: "Milestone Inspection Verification Pending",
      message: `${pendingMilestones.length} milestone stage(s) submitted by contractor require customer verification.`,
      actionTab: "timeline",
      createdAt: new Date().toISOString()
    });
  }

  // 2. Check for Overdue Milestones
  const overdueMilestones = milestones.filter((m) => {
    if (m.status === "completed" || !m.deadline) return false;
    return new Date(m.deadline).getTime() < nowMs;
  });
  if (overdueMilestones.length > 0) {
    alerts.push({
      id: "alert-milestone-overdue",
      type: "warning",
      title: "Timeline Milestone Overdue",
      message: `"${overdueMilestones[0].title}" target deadline passed on ${overdueMilestones[0].deadline}.`,
      actionTab: "timeline",
      createdAt: new Date().toISOString()
    });
  }

  // 3. Check for Pending Payment Requests
  const pendingPayments = paymentRequests.filter((p) => p.status === "pending");
  if (pendingPayments.length > 0) {
    const totalPendingAmt = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    alerts.push({
      id: "alert-payments-pending",
      type: "urgent",
      title: "Payment Approval Requested",
      message: `₹${totalPendingAmt.toLocaleString()} requested for milestone release across ${pendingPayments.length} item(s).`,
      actionTab: "payments",
      createdAt: new Date().toISOString()
    });
  }

  // 4. Check for Site Inactivity (No Daily Log in > 3 days)
  if (dailyLogs.length > 0) {
    const latestLogTime = new Date(dailyLogs[0].createdAt || dailyLogs[0].date).getTime();
    const daysDiff = (nowMs - latestLogTime) / (1000 * 60 * 60 * 24);
    if (daysDiff > 3) {
      alerts.push({
        id: "alert-inactivity",
        type: "warning",
        title: "No Site Activity Logged Recently",
        message: `No site progress logs submitted by contractor in the last ${Math.floor(daysDiff)} days.`,
        actionTab: "progress",
        createdAt: new Date().toISOString()
      });
    }
  }

  // 5. Check Blueprints / Agreements pending verification
  const unverifiedDocs = documents.filter((d) => d.status === "pending" || d.verified === false);
  if (unverifiedDocs.length > 0) {
    alerts.push({
      id: "alert-docs-verification",
      type: "info",
      title: "Document Vault Verification Pending",
      message: `${unverifiedDocs.length} site document(s) (blueprints/agreements) awaiting verification check.`,
      actionTab: "documents",
      createdAt: new Date().toISOString()
    });
  }

  // 6. Active Warranty Alert
  if (warranty) {
    alerts.push({
      id: "alert-warranty-active",
      type: "success",
      title: "Official Workmanship Warranty Active",
      message: `${warranty.durationMonths}-Month Warranty issued for project site handover.`,
      actionTab: "warranty",
      createdAt: new Date().toISOString()
    });
  }

  return alerts;
}
