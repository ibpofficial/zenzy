import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";
import {
  ProCustomer,
  ProCustomerNote,
  ProCustomerFollowup,
  ProPortfolioAlbum,
  ProCalendarEvent,
  ProVaultDocument,
  ProTeamMember,
  ProTeamAttendance,
  ProExpense,
  ProWarrantyRecord,
  ProSupplier,
  ProMaterialPrice
} from "./schema";

// ==========================================
// 1. CUSTOMER CRM SERVICES
// ==========================================

export async function createProCustomer(data: Omit<ProCustomer, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_customers"), {
    ...data,
    isFavourite: data.isFavourite || false,
    isRepeat: data.isRepeat || false,
    completedProjectsCount: data.completedProjectsCount || 0,
    totalRevenue: data.totalRevenue || 0,
    createdAt: now,
    updatedAt: now
  });
  return ref.id;
}

export async function updateProCustomer(id: string, updates: Partial<ProCustomer>): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "pro_customers", id), {
    ...updates,
    updatedAt: now
  });
}

export async function addProCustomerNote(noteData: Omit<ProCustomerNote, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_customer_notes"), {
    ...noteData,
    createdAt: now
  });
  return ref.id;
}

export async function addProCustomerFollowup(followupData: Omit<ProCustomerFollowup, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_customer_followups"), {
    ...followupData,
    createdAt: now
  });

  // Also auto-sync to Calendar
  await addDoc(collection(db, "pro_calendar_events"), {
    professionalId: followupData.professionalId,
    type: "customer_followup",
    title: `Follow-up: ${followupData.customerName || 'Customer'}`,
    startDate: followupData.dueDate,
    endDate: followupData.dueDate,
    customerId: followupData.customerId,
    customerName: followupData.customerName,
    notes: followupData.note,
    source: "crm",
    color: "#8b5cf6"
  });

  return ref.id;
}

// ==========================================
// 2. PORTFOLIO SERVICES
// ==========================================

export async function createPortfolioAlbum(albumData: Omit<ProPortfolioAlbum, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_portfolio_albums"), {
    ...albumData,
    createdAt: now
  });
  return ref.id;
}

export async function updatePortfolioAlbum(id: string, updates: Partial<ProPortfolioAlbum>): Promise<void> {
  await updateDoc(doc(db, "pro_portfolio_albums", id), updates);
}

// ==========================================
// 3. CALENDAR SERVICES
// ==========================================

export async function createCalendarEvent(eventData: Omit<ProCalendarEvent, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "pro_calendar_events"), eventData);
  return ref.id;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, "pro_calendar_events", id));
}

// ==========================================
// 4. VAULT SERVICES
// ==========================================

export async function uploadVaultDocument(docData: Omit<ProVaultDocument, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_vault_documents"), {
    ...docData,
    createdAt: now
  });
  return ref.id;
}

// ==========================================
// 5. TEAM SERVICES
// ==========================================

export async function addTeamMember(memberData: Omit<ProTeamMember, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_team_members"), {
    ...memberData,
    createdAt: now
  });
  return ref.id;
}

export async function markTeamAttendance(attData: Omit<ProTeamAttendance, "id">): Promise<string> {
  const q = query(
    collection(db, "pro_team_attendance"),
    where("professionalId", "==", attData.professionalId),
    where("employeeId", "==", attData.employeeId),
    where("date", "==", attData.date)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    const existingDoc = snap.docs[0];
    await updateDoc(doc(db, "pro_team_attendance", existingDoc.id), { status: attData.status });
    return existingDoc.id;
  }
  const ref = await addDoc(collection(db, "pro_team_attendance"), attData);
  return ref.id;
}

// ==========================================
// 6. FINANCE SERVICES
// ==========================================

export async function logExpense(expData: Omit<ProExpense, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_expenses"), {
    ...expData,
    createdAt: now
  });
  return ref.id;
}

// ==========================================
// 7. WARRANTY SERVICES
// ==========================================

export async function createWarrantyRecord(recordData: Omit<ProWarrantyRecord, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_warranties"), {
    ...recordData,
    issues: recordData.issues || [],
    createdAt: now
  });

  // Also auto-sync warranty end date / renewal to Calendar
  await addDoc(collection(db, "pro_calendar_events"), {
    professionalId: recordData.professionalId,
    type: "warranty_reminder",
    title: `Warranty End: ${recordData.projectTitle || 'Project'}`,
    startDate: recordData.endDate,
    endDate: recordData.endDate,
    customerId: recordData.customerId,
    customerName: recordData.customerName,
    notes: `Warranty expires for ${recordData.customerName}`,
    source: "warranty",
    color: "#f59e0b"
  });

  return ref.id;
}

// ==========================================
// 8. SUPPLIER SERVICES
// ==========================================

export async function addSupplier(supData: Omit<ProSupplier, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_suppliers"), {
    ...supData,
    createdAt: now
  });
  return ref.id;
}

export async function addMaterialPrice(priceData: Omit<ProMaterialPrice, "id" | "createdAt">): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, "pro_material_prices"), {
    ...priceData,
    createdAt: now
  });
  return ref.id;
}
