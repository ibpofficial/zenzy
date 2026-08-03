import { db } from "./firebase";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { ProjectEvent } from "./schema";
import { recalculateProjectTrust } from "./projectTrust";

/**
 * Single chokepoint helper function to write a ProjectEvent to Firestore
 * `projects/{projectId}/events` collection and trigger necessary project-level updates.
 */
export async function logProjectEvent(
  projectId: string,
  event: Omit<ProjectEvent, "id">
): Promise<string> {
  if (!projectId) throw new Error("logProjectEvent: projectId is required");

  const eventPayload = {
    projectId,
    type: event.type,
    title: event.title,
    description: event.description || "",
    actorId: event.actorId || "system",
    actorName: event.actorName || "System Audit",
    actorRole: event.actorRole || "system",
    relatedId: event.relatedId || "",
    metadata: event.metadata || {},
    createdAt: event.createdAt || new Date().toISOString()
  };

  // 1. Write event to Firestore subcollection `projects/{projectId}/events`
  const docRef = await addDoc(collection(db, "projects", projectId, "events"), eventPayload);

  // 2. Trigger project-level trust recalculation asynchronously
  try {
    await recalculateProjectTrust(projectId);
  } catch (err) {
    console.error("Error recalculating project trust on event log:", err);
  }

  return docRef.id;
}
