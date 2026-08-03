import { NextResponse } from "next/server";
import { upsertContact, upsertDeal, addNoteToContact } from "@/lib/hubspot";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, updateDoc } from "firebase/firestore";

export async function POST(request: Request) {
  let workerId = "";
  try {
    const body = await request.json();
    workerId = body.workerId || body.uid;

    if (!workerId) {
      return NextResponse.json({ error: "Missing required workerId or uid" }, { status: 400 });
    }

    const {
      name = "",
      ownerName = "",
      email = "",
      phone = "",
      category = "",
      subcategory = "",
      gstNumber = "",
      licenseNumber = "",
      experience = "",
      serviceArea = "",
      bio = "",
      documentVerifications = {},
    } = body;

    const actualGst = gstNumber || documentVerifications?.gstNumber || "";
    const actualLicense = licenseNumber || documentVerifications?.licenseNumber || "";

    // 1. Upsert Contact in HubSpot (Always succeeds with crm.objects.contacts.write)
    const contactProps: any = {
      email: email || `${workerId}@placeholder.zenzy.shop`,
      firstname: ownerName || name,
      lastname: ownerName ? `(${name})` : "",
      company: name,
      phone,
      zenzy_uid: workerId,
      zenzy_category: subcategory ? `${category} - ${subcategory}` : category,
      zenzy_gst_number: actualGst,
      zenzy_license_number: actualLicense,
      zenzy_experience: typeof experience === "number" ? `${experience} years` : experience,
    };

    const contact = await upsertContact(contactProps);

    // 2. Upsert Deal in HubSpot (Graceful if crm.objects.deals.write is pending in Private App)
    let dealId: string | null = null;
    try {
      const pipeline = process.env.HUBSPOT_ONBOARDING_PIPELINE || "default";
      const stage = process.env.HUBSPOT_ONBOARDING_STAGE || "appointmentscheduled";

      const dealProps: any = {
        dealname: `Onboarding - ${name || workerId}`,
        pipeline,
        dealstage: stage,
        zenzy_uid: workerId,
      };

      const deal = await upsertDeal(dealProps, contact.id);
      dealId = deal.id;
    } catch (dealErr: any) {
      console.warn("HubSpot Deal creation skipped (Check 'crm.objects.deals.write' scope in HubSpot Private App):", dealErr.message);
    }

    // 3. Add timeline note to Contact
    const noteContent = [
      `📌 **Zenzy Professional Application Submitted**`,
      `• **Business Name:** ${name}`,
      `• **Owner Name:** ${ownerName || "N/A"}`,
      `• **Category:** ${category}${subcategory ? ` (${subcategory})` : ""}`,
      `• **Phone:** ${phone || "N/A"}`,
      `• **Email:** ${email || "N/A"}`,
      `• **Experience:** ${experience || "N/A"}`,
      `• **Service Area:** ${serviceArea || "N/A"}`,
      `• **GSTIN:** ${actualGst || "Not provided"}`,
      `• **License No:** ${actualLicense || "Not provided"}`,
      `• **Bio:** ${bio || "N/A"}`,
      `• **Zenzy UID:** ${workerId}`,
    ].join("\n");

    await addNoteToContact(contact.id, noteContent);

    // 4. Update Firestore worker document with sync metadata
    const syncedAt = new Date().toISOString();
    const workerRef = doc(db, "workers", workerId);

    await setDoc(
      workerRef,
      {
        hubspotContactId: contact.id,
        hubspotDealId: dealId,
        hubspotSyncedAt: syncedAt,
        hubspotSyncStatus: "synced",
        hubspotSyncError: null,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      workerId,
      hubspotContactId: contact.id,
      hubspotDealId: dealId,
      syncedAt,
    });
  } catch (error: any) {
    console.error("Error in sync-professional route:", error);

    if (workerId) {
      try {
        const workerRef = doc(db, "workers", workerId);
        await updateDoc(workerRef, {
          hubspotSyncStatus: "failed",
          hubspotSyncError: error.message || "Unknown sync error",
        });

        await addDoc(collection(db, "syncFailures"), {
          type: "professional",
          workerId,
          error: error.message || "Unknown sync error",
          timestamp: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error("Failed to update sync failure in Firestore:", dbErr);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to sync professional to HubSpot",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
