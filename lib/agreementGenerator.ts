import { Quotation, Agreement, ProjectDocument } from "./schema";
import { db, cleanFirestoreData } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { logProjectEvent } from "./projectEvents";

export interface GenerateAgreementInput {
  projectId?: string;
  quotation: Quotation;
  inquiryId?: string;
  clientId: string;
  clientName: string;
  businessId: string;
  businessName: string;
  clientSignatureName: string;
  clientSignatureDataUrl?: string;
  proSignatureName?: string;
  proSignatureDataUrl?: string;
  advanceAmount?: number;
}

export async function createAndVaultAgreement(input: GenerateAgreementInput): Promise<Agreement> {
  const now = new Date().toISOString();
  const q = input.quotation;

  const totalCost = q.grandTotal || q.subtotal || q.total || 0;
  const advanceAmount = input.advanceAmount || 0;

  const scopeSummary = q.projectDescription || q.quoteDocumentTitle || `Execution of ${q.projectTitle || "Construction/Interior Services"}`;
  
  const paymentScheduleSummary = q.paymentTerms || `Milestone payments released upon verified stage completion.`;
  const timelineEstimate = q.expectedCompletionDate ? `Target Completion: ${q.expectedCompletionDate}` : `${q.workingDays || 30} Working Days`;
  const warrantyTerms = q.warrantyTerms || "12 Months Comprehensive Workmanship & Material Defect Warranty.";
  const cancellationPolicy = q.cancellationPolicy || "Full refund minus material sourcing costs before site execution begins.";
  const responsibilities = q.materialResponsibility || "Contractor provides verified materials; Client provides uninterrupted site access & electrical/water connections.";

  const rawAgreementData: Omit<Agreement, "id"> = {
    projectId: input.projectId || "",
    quotationId: q.id || "",
    inquiryId: input.inquiryId || q.inquiryId || q.enquiryId || "",
    businessId: input.businessId || q.businessId || q.workerId || "",
    businessName: input.businessName || q.businessName || q.workerName || "Verified Professional",
    clientId: input.clientId || q.customerId || "client",
    clientName: input.clientName || q.customerName || "Valued Client",
    scopeSummary,
    totalCost,
    advanceAmount,
    paymentScheduleSummary,
    timelineEstimate,
    warrantyTerms,
    cancellationPolicy,
    responsibilities,
    clientSignatureName: input.clientSignatureName || "",
    clientSignatureDataUrl: input.clientSignatureDataUrl || "",
    clientSignedAt: now,
    proSignatureName: input.proSignatureName || input.businessName || "Verified Professional",
    proSignatureDataUrl: input.proSignatureDataUrl || "",
    proSignedAt: now,
    status: "signed",
    createdAt: now
  };

  const agreementData = cleanFirestoreData(rawAgreementData);

  const agreementRef = await addDoc(collection(db, "agreements"), agreementData);
  const agreementId = agreementRef.id;

  // Vault as ProjectDocument if projectId exists
  if (input.projectId) {
    const rawDocData: Omit<ProjectDocument, "id"> = {
      projectId: input.projectId,
      type: "agreement",
      name: `Legal Execution Agreement - ${input.clientName}`,
      fileUrl: `https://zenzy.app/agreements/${agreementId}`,
      uploadedBy: input.clientId || "client",
      status: "verified",
      verified: true,
      createdAt: now,
      version: 1
    };

    const docData = cleanFirestoreData(rawDocData);

    await addDoc(collection(db, "projects", input.projectId, "documents"), docData);
    await addDoc(collection(db, "documents"), docData);

    // Log Agreement Signed Event
    try {
      await logProjectEvent(input.projectId, {
        projectId: input.projectId,
        type: "agreement_signed",
        title: `Project Agreement Digitally Executed & Signed`,
        description: `Contract signed by ${input.clientName} and ${input.businessName}. Total Value: ₹${totalCost.toLocaleString("en-IN")}`,
        actorId: input.clientId || "client",
        actorName: input.clientName || "Client",
        actorRole: "client",
        relatedId: agreementId,
        createdAt: now
      });
    } catch (logErr) {
      console.warn("Event logging warning:", logErr);
    }
  }

  return { id: agreementId, ...agreementData };
}
