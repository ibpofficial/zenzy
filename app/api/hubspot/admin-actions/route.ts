import { NextResponse } from "next/server";
import {
  addNoteToContact,
  createHubSpotTask,
  updateDealStage,
  getHubSpotHealth,
  upsertContact,
  upsertDeal,
  sanitizeEmail,
} from "@/lib/hubspot";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, contactId, dealId, noteText, taskSubject, dueDateMs, priority, newStage, pipeline } = body;

    switch (action) {
      case "CHECK_HEALTH": {
        const health = await getHubSpotHealth();
        return NextResponse.json({ success: true, health });
      }

      case "ADD_NOTE": {
        if (!contactId || !noteText) {
          return NextResponse.json({ error: "contactId and noteText are required" }, { status: 400 });
        }
        const noteId = await addNoteToContact(contactId, noteText);
        return NextResponse.json({ success: !!noteId, noteId });
      }

      case "CREATE_TASK": {
        if (!contactId || !taskSubject) {
          return NextResponse.json({ error: "contactId and taskSubject are required" }, { status: 400 });
        }
        const taskId = await createHubSpotTask(contactId, taskSubject, dueDateMs, priority);
        return NextResponse.json({ success: !!taskId, taskId });
      }

      case "UPDATE_STAGE": {
        if (!dealId || !newStage) {
          return NextResponse.json({ error: "dealId and newStage are required" }, { status: 400 });
        }
        const ok = await updateDealStage(dealId, newStage, pipeline);
        return NextResponse.json({ success: ok });
      }

      case "FORCE_SYNC_ALL": {
        const workersRef = collection(db, "workers");
        const snapshot = await getDocs(workersRef);
        let syncedCount = 0;
        let failedCount = 0;

        const errors: any[] = [];

        for (const workerDoc of snapshot.docs) {
          const wData = workerDoc.data();
          const wId = workerDoc.id;

          try {
            const contactProps: any = {
              email: sanitizeEmail(wData.email, wId),
              firstname: wData.ownerName || wData.name || "Worker",
              lastname: wData.ownerName ? `(${wData.name})` : "",
              company: wData.name || "",
              phone: wData.phone || "",
              zenzy_uid: wId,
              zenzy_category: wData.subcategory ? `${wData.category} - ${wData.subcategory}` : wData.category || "",
              zenzy_gst_number: wData.gstNumber || wData.documentVerifications?.gstNumber || "",
              zenzy_license_number: wData.licenseNumber || wData.documentVerifications?.licenseNumber || "",
              zenzy_experience: typeof wData.experience === "number" ? `${wData.experience} years` : wData.experience || "",
            };

            const contact = await upsertContact(contactProps);

            let dealId: string | null = null;
            try {
              const dealProps: any = {
                dealname: `Onboarding - ${wData.name || wId}`,
                pipeline: process.env.HUBSPOT_ONBOARDING_PIPELINE || "default",
                dealstage: process.env.HUBSPOT_ONBOARDING_STAGE || "appointmentscheduled",
                zenzy_uid: wId,
              };
              const deal = await upsertDeal(dealProps, contact.id);
              dealId = deal.id;
            } catch (dErr) {
              // Ignore deal scope warnings gracefully
            }

            const syncedAt = new Date().toISOString();
            await setDoc(
              doc(db, "workers", wId),
              {
                hubspotContactId: contact.id,
                hubspotDealId: dealId,
                hubspotSyncedAt: syncedAt,
                hubspotSyncStatus: "synced",
                hubspotSyncError: null,
              },
              { merge: true }
            );

            syncedCount++;
          } catch (err: any) {
            failedCount++;
            errors.push({ workerId: wId, name: wData.name, error: err.message });
            await setDoc(
              doc(db, "workers", wId),
              {
                hubspotSyncStatus: "failed",
                hubspotSyncError: err.message || "Force sync failed",
              },
              { merge: true }
            );
          }
        }

        return NextResponse.json({
          success: true,
          syncedCount,
          failedCount,
          total: snapshot.docs.length,
          errors,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in hubspot/admin-actions route:", error);
    return NextResponse.json({ error: "Failed to execute admin action", details: error.message }, { status: 500 });
  }
}
