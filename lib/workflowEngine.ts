import { Milestone, DailyLog, ProjectDocument, ProjectMedia, PaymentRequest } from "./schema";

export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  missingRequirements?: string[];
}

/**
 * Enforces rule: A milestone cannot move to `in_progress` while any milestone
 * in its `dependsOnMilestoneIds` is not `completed`.
 */
export function canStartMilestone(
  targetMilestone: Milestone,
  allMilestones: Milestone[]
): ValidationResult {
  if (!targetMilestone.dependsOnMilestoneIds || targetMilestone.dependsOnMilestoneIds.length === 0) {
    return { allowed: true };
  }

  const uncompletedDeps = allMilestones.filter((m) => {
    // Check match by ID, workflowStageId, or order dependency
    const matchesDep =
      targetMilestone.dependsOnMilestoneIds?.includes(m.id) ||
      (m.workflowStageId && targetMilestone.dependsOnMilestoneIds?.includes(m.workflowStageId)) ||
      (m.order < targetMilestone.order && targetMilestone.dependsOnMilestoneIds?.includes(`hc-${m.order}`));
    return matchesDep && m.status !== "completed";
  });

  if (uncompletedDeps.length > 0) {
    const depNames = uncompletedDeps.map((m) => `"${m.title}"`).join(", ");
    return {
      allowed: false,
      reason: `Blocked: Waiting for prerequisite milestone(s) ${depNames} to complete first.`
    };
  }

  return { allowed: true };
}

/**
 * Enforces rule: Before a milestone can move to `completed` or request completion,
 * check off whatever is required per its WorkflowStage config.
 */
export function canRequestMilestoneCompletion(
  milestone: Milestone,
  allMilestones: Milestone[],
  dailyLogs: DailyLog[],
  documents: ProjectDocument[],
  media: ProjectMedia[]
): ValidationResult {
  const missing: string[] = [];

  // 1. Dependency check
  const startCheck = canStartMilestone(milestone, allMilestones);
  if (!startCheck.allowed) {
    return {
      allowed: false,
      reason: startCheck.reason,
      missingRequirements: [startCheck.reason || "Prerequisites pending"]
    };
  }

  // 2. Media requirement (before photos/videos)
  if (milestone.mediaRequired) {
    const milestoneMedia = media.filter((m) => m.milestoneId === milestone.id || m.projectId === milestone.projectId);
    const hasLogPhotos = dailyLogs.some(
      (l) => (l.milestoneId === milestone.id || !l.milestoneId) && ((l.beforePhotoIds && l.beforePhotoIds.length > 0) || (l.afterPhotoIds && l.afterPhotoIds.length > 0))
    );
    if (milestoneMedia.length === 0 && !hasLogPhotos) {
      missing.push("Before/site execution photos or videos required");
    }
  }

  // 3. Documents requirement
  if (milestone.documentsRequired && milestone.documentsRequired.length > 0) {
    for (const reqDocType of milestone.documentsRequired) {
      const docExists = documents.some(
        (d) => d.type === reqDocType && d.status !== "rejected"
      );
      if (!docExists) {
        missing.push(`Required document "${reqDocType.replace("_", " ").toUpperCase()}" missing from vault`);
      }
    }
  }

  // 4. Inspection requirement
  if (milestone.inspectionRequired && !milestone.inspectionId && !milestone.proApproved) {
    missing.push("Contractor site completion inspection recorded");
  }

  if (missing.length > 0) {
    return {
      allowed: false,
      reason: `Requirements checklist incomplete (${missing.length} missing items).`,
      missingRequirements: missing
    };
  }

  return { allowed: true };
}

/**
 * Enforces rule: A PaymentRequest linked to a milestone cannot be released while
 * that milestone's inspectionRequired is true and no approved inspection exists.
 */
export function canReleasePayment(
  paymentRequest: PaymentRequest,
  milestone?: Milestone | null
): ValidationResult {
  if (!milestone) return { allowed: true };

  if (milestone.inspectionRequired) {
    if (!milestone.proApproved && !milestone.clientApproved) {
      return {
        allowed: false,
        reason: `Payment release blocked: Milestone "${milestone.title}" requires completed inspection & client verification first.`
      };
    }
  }

  return { allowed: true };
}

/**
 * Enforces rule: Project cannot be marked `completed` while any `mandatory` milestone
 * is incomplete or any required final document is missing.
 */
export function canCompleteProject(
  milestones: Milestone[],
  documents: ProjectDocument[]
): ValidationResult {
  const incompleteMandatory = milestones.filter(
    (m) => m.mandatory && m.status !== "completed"
  );

  if (incompleteMandatory.length > 0) {
    const names = incompleteMandatory.map((m) => `"${m.title}"`).join(", ");
    return {
      allowed: false,
      reason: `Cannot complete project: Mandatory stage(s) ${names} are still incomplete.`
    };
  }

  // Check mandatory final documents (e.g. agreement, warranty)
  const agreementExists = documents.some((d) => d.type === "agreement" && d.status !== "rejected");
  if (!agreementExists) {
    return {
      allowed: false,
      reason: "Cannot complete project: Signed Project Agreement document is missing from vault."
    };
  }

  return { allowed: true };
}
