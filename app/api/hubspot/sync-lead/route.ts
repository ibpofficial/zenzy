import { NextResponse } from "next/server";
import { upsertContact, upsertDeal, addNoteToContact } from "@/lib/hubspot";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName = "",
      customerEmail = "",
      subject = "",
      message = "",
      ticketId = "",
    } = body;

    if (!customerEmail && !customerName) {
      return NextResponse.json({ error: "Missing customer details (name or email required)" }, { status: 400 });
    }

    // 1. Upsert Contact (Always succeeds with crm.objects.contacts.write scope)
    const nameParts = customerName.trim().split(" ");
    const firstname = nameParts[0] || customerName || "Inbound Lead";
    const lastname = nameParts.slice(1).join(" ") || "";

    const contact = await upsertContact({
      email: customerEmail || `lead_${Date.now()}@placeholder.zenzy.shop`,
      firstname,
      lastname,
      phone: body.customerPhone || body.phone || "",
      zenzy_uid: ticketId || `lead_${Date.now()}`,
    });

    // 2. Attempt Upsert Deal (Graceful fallback if crm.objects.deals.write scope is missing)
    let dealId: string | null = null;
    try {
      const pipeline = process.env.HUBSPOT_PARTNERSHIPS_PIPELINE || "default";
      const stage = process.env.HUBSPOT_PARTNERSHIPS_STAGE || "appointmentscheduled";

      const dealProps: any = {
        dealname: `Partnership Lead - ${customerName || "Inquiry"} (${subject || "Contact Form"})`,
        pipeline,
        dealstage: stage,
        zenzy_uid: ticketId || `lead_${Date.now()}`,
      };

      const deal = await upsertDeal(dealProps, contact.id);
      dealId = deal.id;
    } catch (dealErr: any) {
      console.warn("HubSpot Deal creation skipped (Check if 'crm.objects.deals.write' scope is granted in HubSpot Private App):", dealErr.message);
    }

    // 3. Add timeline Note
    const noteContent = [
      `💬 **Zenzy Inbound Contact Form Lead**`,
      `• **Name:** ${customerName}`,
      `• **Email:** ${customerEmail}`,
      `• **Subject:** ${subject}`,
      `• **Message:** ${message}`,
      `• **Ticket ID:** ${ticketId || "N/A"}`,
    ].join("\n");

    await addNoteToContact(contact.id, noteContent);

    return NextResponse.json({
      success: true,
      hubspotContactId: contact.id,
      hubspotDealId: dealId,
      message: dealId ? "Synced Contact & Deal to HubSpot" : "Synced Contact to HubSpot (Grant 'crm.objects.deals.write' in Private App to enable Deals)",
    });
  } catch (error: any) {
    console.error("Error in sync-lead route:", error);

    try {
      await addDoc(collection(db, "syncFailures"), {
        type: "lead",
        error: error.message || "Unknown lead sync error",
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error("Failed to log lead sync failure:", dbErr);
    }

    return NextResponse.json(
      {
        error: "Failed to sync lead to HubSpot",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
