import { db } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ProjectWarranty } from "@/lib/schema";

export interface CreateWarrantyPayload {
  projectId: string;
  businessId: string;
  durationMonths?: number;
  coverage?: string;
  documentUrl?: string;
}

/**
 * Creates and vaults a ProjectWarranty record in Firestore upon project completion,
 * linking it to the project document.
 */
export async function createAndVaultWarranty(payload: CreateWarrantyPayload): Promise<string> {
  try {
    const now = new Date().toISOString();
    const durationMonths = payload.durationMonths || 12;
    const coverage =
      payload.coverage ||
      "Comprehensive 12-Month Coverage for Structural Workmanship, MEP Fixtures & Material Integrity against manufacturing defects.";

    const warrantyData: Omit<ProjectWarranty, "id"> = {
      projectId: payload.projectId,
      businessId: payload.businessId,
      durationMonths,
      coverage,
      issuedAt: now,
      documentUrl: payload.documentUrl || "",
    };

    const docRef = await addDoc(collection(db, "warranties"), warrantyData);

    // Update project document with warranty reference
    try {
      await updateDoc(doc(db, "projects", payload.projectId), {
        warrantyId: docRef.id,
        completedAt: now,
        status: "completed",
      });
    } catch (pErr) {
      console.warn("Failed to update project with warrantyId:", pErr);
    }

    return docRef.id;
  } catch (err) {
    console.error("Error creating and vaulting warranty:", err);
    throw err;
  }
}
