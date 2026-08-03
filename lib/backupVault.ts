import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
  Firestore
} from "firebase/firestore";

export const ALL_BACKUP_COLLECTIONS = [
  "users",
  "workers",
  "bookings",
  "rentals",
  "categories",
  "projects",
  "meetings",
  "quotations",
  "inquiries",
  "professionalEnquiries",
  "professionalServices",
  "agreements",
  "documents",
  "warranties",
  "milestones",
  "dailyLogs",
  "projectDocuments",
  "paymentRequests",
  "shopOrders",
  "shopProducts",
  "productReviews",
  "stockAlerts",
  "reviews",
  "propertyReviews",
  "payments",
  "coupons",
  "supportTickets",
  "promos",
  "team",
  "broadcasts",
  "complaints",
  "settings",
  "admins",
  "notifications",
  "activityLogs",
  "auditLogs",
  "workflowTemplates",
  "invoices",
  "addresses",
  "favorites",
  "materialEntries",
  "projectMedia",
  "projectTeam",
  "pushSubscriptions",
  "syncFailures",
];

export interface BackupSummaryMetrics {
  meetingsCount: number;
  quotationsCount: number;
  bookingsCount: number;
  bookingsByStage: Record<string, number>;
  projectsCount: number;
  milestonesCount: number;
  workersCount: number;
  usersCount: number;
  rentalsCount: number;
  shopOrdersCount: number;
  inquiriesCount: number;
  agreementsCount: number;
  totalRevenue: number;
}

export interface MasterBackupPayload {
  version: string;
  exportedAt: string;
  exportedBy: string;
  totalRecordsCount: number;
  totalCollectionsCount: number;
  counts: Record<string, number>;
  summary: BackupSummaryMetrics;
  data: Record<string, any[]>;
  subcollections?: Record<string, any[]>;
}

export interface RestoreOptions {
  cleanBeforeRestore?: boolean;
  overwriteAdmins?: boolean;
}

export interface RestoreProgress {
  currentStep: string;
  progressPercent: number;
  restoredCount: number;
  totalCount: number;
}

export async function exportMasterBackup(
  db: Firestore,
  exportedBy: string = "Admin Operator"
): Promise<MasterBackupPayload> {
  const data: Record<string, any[]> = {};
  const subcollections: Record<string, any[]> = {};
  const counts: Record<string, number> = {};
  let totalRecords = 0;

  for (const colName of ALL_BACKUP_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data[colName] = docs;
      counts[colName] = docs.length;
      totalRecords += docs.length;

      // Export subcollections for projects if present
      if (colName === "projects") {
        for (const docSnap of snap.docs) {
          const projectId = docSnap.id;
          const subNames = ["events", "messages", "documents", "milestones", "dailyLogs"];
          for (const subName of subNames) {
            try {
              const subSnap = await getDocs(collection(db, "projects", projectId, subName));
              if (!subSnap.empty) {
                const subKey = `projects/${projectId}/${subName}`;
                const subDocs = subSnap.docs.map((sd) => ({ id: sd.id, ...sd.data() }));
                subcollections[subKey] = subDocs;
                totalRecords += subDocs.length;
              }
            } catch (err) {
              console.warn(`Could not fetch subcollection projects/${projectId}/${subName}`, err);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to export collection ${colName}:`, err);
      data[colName] = [];
      counts[colName] = 0;
    }
  }

  // Calculate detailed summary statistics
  const meetings = data["meetings"] || [];
  const quotations = data["quotations"] || [];
  const bookings = data["bookings"] || [];
  const projects = data["projects"] || [];
  const milestones = data["milestones"] || [];
  const workers = data["workers"] || [];
  const users = data["users"] || [];
  const rentals = data["rentals"] || [];
  const shopOrders = data["shopOrders"] || [];
  const inquiries = data["inquiries"] || [];
  const agreements = data["agreements"] || [];
  const payments = data["payments"] || [];

  const bookingsByStage: Record<string, number> = {};
  let totalRevenue = 0;

  bookings.forEach((b) => {
    const stage = b.status || b.stage || "Pending";
    bookingsByStage[stage] = (bookingsByStage[stage] || 0) + 1;
    const priceVal = Number(b.price || b.amount || b.totalAmount || 0);
    if (!isNaN(priceVal)) totalRevenue += priceVal;
  });

  payments.forEach((p) => {
    if (p.status === "completed" || p.status === "Success" || p.status === "Paid") {
      const amt = Number(p.amount || 0);
      if (!isNaN(amt)) totalRevenue += amt;
    }
  });

  const payload: MasterBackupPayload = {
    version: "2.5.0-MASTER-ENTERPRISE",
    exportedAt: new Date().toISOString(),
    exportedBy,
    totalRecordsCount: totalRecords,
    totalCollectionsCount: Object.keys(data).length,
    counts,
    summary: {
      meetingsCount: meetings.length,
      quotationsCount: quotations.length,
      bookingsCount: bookings.length,
      bookingsByStage,
      projectsCount: projects.length,
      milestonesCount: milestones.length,
      workersCount: workers.length,
      usersCount: users.length,
      rentalsCount: rentals.length,
      shopOrdersCount: shopOrders.length,
      inquiriesCount: inquiries.length,
      agreementsCount: agreements.length,
      totalRevenue,
    },
    data,
    subcollections,
  };

  return payload;
}

export async function restoreMasterBackup(
  db: Firestore,
  payload: any,
  options: RestoreOptions = {},
  onProgress?: (progress: RestoreProgress) => void
): Promise<{ success: boolean; restoredCount: number; errors: string[] }> {
  let collectionsData: Record<string, any[]> = {};
  let subcollectionsData: Record<string, any[]> = {};

  if (payload && payload.data && typeof payload.data === "object") {
    collectionsData = payload.data;
    subcollectionsData = payload.subcollections || {};
  } else if (payload && payload.collection && Array.isArray(payload.records)) {
    collectionsData[payload.collection] = payload.records;
  } else if (payload && typeof payload === "object") {
    for (const [key, val] of Object.entries(payload)) {
      if (Array.isArray(val)) {
        collectionsData[key] = val;
      }
    }
  }

  let totalCount = 0;
  for (const arr of Object.values(collectionsData)) {
    if (Array.isArray(arr)) totalCount += arr.length;
  }
  for (const arr of Object.values(subcollectionsData)) {
    if (Array.isArray(arr)) totalCount += arr.length;
  }

  if (totalCount === 0) {
    throw new Error("No valid records found in the provided backup archive JSON.");
  }

  let restoredCount = 0;
  const errors: string[] = [];

  if (options.cleanBeforeRestore) {
    if (onProgress) {
      onProgress({
        currentStep: "Wiping existing database collections for clean recovery...",
        progressPercent: 5,
        restoredCount: 0,
        totalCount,
      });
    }
    const SAFE_ADMIN_EMAILS = [
      "ishantpbupadhyay@gmail.com",
      "25tec2cs089@vgu.ac.in",
      "zenzyconnect@gmail.com",
    ];

    for (const colName of ALL_BACKUP_COLLECTIONS) {
      if (colName === "admins" && !options.overwriteAdmins) continue;
      try {
        const snap = await getDocs(collection(db, colName));
        for (const docSnap of snap.docs) {
          const docData = docSnap.data();
          if (docData.email && SAFE_ADMIN_EMAILS.includes(String(docData.email).toLowerCase())) {
            continue;
          }
          await deleteDoc(doc(db, colName, docSnap.id));
        }
      } catch (e) {
        console.warn(`Could not clear collection ${colName}:`, e);
      }
    }
  }

  const writeDocsToCol = async (colPath: string, docs: any[]) => {
    const CHUNK_SIZE = 150;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const item of chunk) {
        if (!item || typeof item !== "object") continue;
        const { id, ...rest } = item;
        const docRef = id ? doc(db, colPath, id) : doc(collection(db, colPath));
        batch.set(docRef, rest, { merge: true });
      }
      try {
        await batch.commit();
        restoredCount += chunk.length;
      } catch (err: any) {
        console.error(`Batch write error for ${colPath}:`, err);
        for (const item of chunk) {
          if (!item || typeof item !== "object") continue;
          const { id, ...rest } = item;
          try {
            if (id) {
              await setDoc(doc(db, colPath, id), rest, { merge: true });
            } else {
              await addDoc(collection(db, colPath), rest);
            }
            restoredCount++;
          } catch (itemErr: any) {
            errors.push(`Failed doc in ${colPath}: ${itemErr?.message || itemErr}`);
          }
        }
      }

      if (onProgress) {
        const pct = Math.min(99, Math.round((restoredCount / totalCount) * 100));
        onProgress({
          currentStep: `Restoring collection: ${colPath} (${restoredCount}/${totalCount} items restored)...`,
          progressPercent: pct,
          restoredCount,
          totalCount,
        });
      }
    }
  };

  // Restore root collections
  for (const [colName, docs] of Object.entries(collectionsData)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;
    if (colName === "admins" && !options.overwriteAdmins) {
      for (const item of docs) {
        if (!item || typeof item !== "object") continue;
        const { id, ...rest } = item;
        if (id) {
          await setDoc(doc(db, "admins", id), rest, { merge: true });
          restoredCount++;
        }
      }
      continue;
    }
    await writeDocsToCol(colName, docs);
  }

  // Restore subcollections
  for (const [subPath, docs] of Object.entries(subcollectionsData)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;
    await writeDocsToCol(subPath, docs);
  }

  if (onProgress) {
    onProgress({
      currentStep: "Restoration Complete!",
      progressPercent: 100,
      restoredCount,
      totalCount,
    });
  }

  return { success: true, restoredCount, errors };
}

export function inspectBackupData(payload: any) {
  let recordCount = 0;
  const counts: Record<string, number> = {};

  let collectionsData: Record<string, any[]> = {};
  if (payload && payload.data && typeof payload.data === "object") {
    collectionsData = payload.data;
  } else if (payload && payload.collection && Array.isArray(payload.records)) {
    collectionsData[payload.collection] = payload.records;
  } else if (payload && typeof payload === "object") {
    for (const [key, val] of Object.entries(payload)) {
      if (Array.isArray(val)) {
        collectionsData[key] = val;
      }
    }
  }

  for (const [colName, arr] of Object.entries(collectionsData)) {
    if (Array.isArray(arr)) {
      counts[colName] = arr.length;
      recordCount += arr.length;
    }
  }

  const meetings = collectionsData["meetings"] || [];
  const quotations = collectionsData["quotations"] || [];
  const bookings = collectionsData["bookings"] || [];
  const projects = collectionsData["projects"] || [];
  const milestones = collectionsData["milestones"] || [];
  const workers = collectionsData["workers"] || [];
  const users = collectionsData["users"] || [];

  return {
    version: payload?.version || "Standard JSON Backup",
    exportedAt: payload?.exportedAt || payload?.timestamp || "Unknown Date",
    exportedBy: payload?.exportedBy || payload?.createdBy || "Admin User",
    totalRecords: recordCount,
    counts,
    summary: payload?.summary || {
      meetingsCount: meetings.length,
      quotationsCount: quotations.length,
      bookingsCount: bookings.length,
      projectsCount: projects.length,
      milestonesCount: milestones.length,
      workersCount: workers.length,
      usersCount: users.length,
    },
  };
}
