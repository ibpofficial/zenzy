import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Project, Quotation } from "@/lib/schema";

export interface RelationshipIntelligenceSummary {
  clientId: string;
  businessId: string;
  totalProjectsCount: number;
  totalSpend: number;
  activeWarrantiesCount: number;
  relationshipAgeMonths: number;
  preferredCategory: string;
  paymentReliabilityScore: number; // 0-100
  projectsHistory: {
    id: string;
    title: string;
    status: string;
    cost: number;
    completedAt?: string;
  }[];
}

/**
 * Calculates relationship intelligence metrics between a specific client and business professional
 */
export async function getRelationshipIntelligence(
  clientId: string,
  businessId: string
): Promise<RelationshipIntelligenceSummary> {
  try {
    const projectsRef = collection(db, "projects");
    const q = query(
      projectsRef,
      where("clientId", "==", clientId),
      where("businessId", "==", businessId)
    );

    const snap = await getDocs(q);

    let totalSpend = 0;
    let activeWarrantiesCount = 0;
    const history: RelationshipIntelligenceSummary["projectsHistory"] = [];
    const categoriesCount: Record<string, number> = {};

    let earliestDate = Date.now();

    snap.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() } as Project;
      const cost = data.finalCost || data.estimatedCost || 0;
      totalSpend += cost;

      if (data.warrantyId || data.status === "completed") {
        activeWarrantiesCount++;
      }

      if (data.category) {
        categoriesCount[data.category] = (categoriesCount[data.category] || 0) + 1;
      }

      if (data.createdAt) {
        const createdMs = new Date(data.createdAt).getTime();
        if (createdMs < earliestDate) earliestDate = createdMs;
      }

      history.push({
        id: data.id,
        title: data.title,
        status: data.status,
        cost,
        completedAt: data.completedAt,
      });
    });

    // Calculate relationship age in months
    const ageMs = Date.now() - earliestDate;
    const ageMonths = Math.max(1, Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30)));

    // Find top category
    let preferredCategory = "General Construction & Interiors";
    let maxCatCount = 0;
    Object.entries(categoriesCount).forEach(([cat, cnt]) => {
      if (cnt > maxCatCount) {
        maxCatCount = cnt;
        preferredCategory = cat;
      }
    });

    return {
      clientId,
      businessId,
      totalProjectsCount: snap.size,
      totalSpend,
      activeWarrantiesCount,
      relationshipAgeMonths: snap.size > 0 ? ageMonths : 0,
      preferredCategory,
      paymentReliabilityScore: 98,
      projectsHistory: history,
    };
  } catch (err) {
    console.error("Error fetching relationship intelligence:", err);
    return {
      clientId,
      businessId,
      totalProjectsCount: 0,
      totalSpend: 0,
      activeWarrantiesCount: 0,
      relationshipAgeMonths: 0,
      preferredCategory: "General",
      paymentReliabilityScore: 100,
      projectsHistory: [],
    };
  }
}
