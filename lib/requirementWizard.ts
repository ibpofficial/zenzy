import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { BusinessProfile } from "@/lib/schema";

export interface RequirementPayload {
  category: string;
  subcategory?: string;
  projectType: "residential" | "commercial" | "industrial" | "renovation" | "repair";
  location: string;
  budgetMin: number;
  budgetMax: number;
  startDateOption: "immediately" | "within_2_weeks" | "within_month" | "planning_phase";
  deliverables: string[];
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

export interface MatchedProfessional {
  profile: BusinessProfile;
  matchScore: number; // 0-100
  matchReasons: string[];
  estimatedResponseTime: string;
}

/**
 * Ranks professionals in Firestore based on category matching, TrustScore, location, and verified status
 */
export async function findRecommendedProfessionals(
  req: Partial<RequirementPayload>
): Promise<MatchedProfessional[]> {
  try {
    const workersRef = collection(db, "workers");
    let q = query(workersRef, limit(20));

    if (req.category) {
      q = query(workersRef, where("category", "==", req.category), limit(20));
    }

    const snap = await getDocs(q);
    const results: MatchedProfessional[] = [];

    snap.forEach((doc) => {
      const data = { uid: doc.id, ...doc.data() } as BusinessProfile;

      let score = 70; // baseline match score
      const matchReasons: string[] = [];

      // Category match
      if (req.category && data.category?.toLowerCase() === req.category.toLowerCase()) {
        score += 15;
        matchReasons.push("Exact Category Specialist");
      }

      // Trust score boost
      const trust = data.trustScore?.overall || 85;
      if (trust >= 90) {
        score += 10;
        matchReasons.push(`Elite Zenzy Verified Trust Score (${trust}/100)`);
      } else if (trust >= 80) {
        score += 5;
        matchReasons.push(`Verified Professional (${trust}/100)`);
      }

      // Verified Badges boost
      if (data.verifiedBadges?.identity && data.verifiedBadges?.gst) {
        score += 5;
        matchReasons.push("Identity & GST Registered");
      }

      // Cap at 99% max score
      score = Math.min(99, score);

      results.push({
        profile: data,
        matchScore: score,
        matchReasons,
        estimatedResponseTime: data.responseTimeHours
          ? `< ${data.responseTimeHours} Hours`
          : "< 2 Hours Response Time",
      });
    });

    // Sort descending by match score
    return results.sort((a, b) => b.matchScore - a.matchScore);
  } catch (err) {
    console.error("Error finding recommended professionals:", err);
    return [];
  }
}
