import { BusinessProfile, Project } from "./schema";

/**
 * Calculates the trust score of a business profile based on verification, reviews,
 * projects completion, response time, portfolio details, and profile completeness.
 */
export function calculateTrustScore(input: {
  profile: BusinessProfile;
  reviews: { rating: number }[];
  projects: { status: Project["status"] }[];
  avgResponseTimeHours?: number;
}): Required<BusinessProfile>["trustScore"] {
  const { profile, reviews, projects, avgResponseTimeHours } = input;

  // 1. Identity Verification (Max 20 pts)
  const identityVerified = !!profile.verifiedBadges?.identity;
  const identityVerificationScore = identityVerified ? 20 : 0;

  // 2. Professional Documents (Max 15 pts)
  let professionalDocumentsScore = 0;
  if (profile.verifiedBadges?.gst) professionalDocumentsScore += 4;
  if (profile.verifiedBadges?.businessReg) professionalDocumentsScore += 4;
  if (profile.verifiedBadges?.officeAddress) professionalDocumentsScore += 3;
  if (profile.gstNumber || profile.documentVerifications?.gstNumber) professionalDocumentsScore += 2;
  if (profile.licenseNumber || profile.documentVerifications?.licenseNumber) professionalDocumentsScore += 2;

  // 3. Client Reviews (Max 20 pts)
  // Bayesian average formula: (R * v + C * m) / (v + m)
  // where R = average rating of reviews, v = review count, C = platform prior (3.0 stars), m = threshold weight (5 reviews)
  const reviewCount = reviews.length;
  let clientReviewsScore = 0;
  if (reviewCount > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviewCount;
    const priorRating = 3.0;
    const priorWeight = 5;
    const bayesianRating = (avgRating * reviewCount + priorRating * priorWeight) / (reviewCount + priorWeight);
    clientReviewsScore = (bayesianRating / 5.0) * 20;
  }

  // 4. Project Completion Rate (Max 15 pts)
  // Weighted completion rate blended with neutral prior below 5 completed projects
  // Neutral completion rate prior of 90% over a weight of 5 projects
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const cancelledProjects = projects.filter((p) => p.status === "cancelled").length;
  const totalProjects = completedProjects + cancelledProjects;
  const priorProjectsWeight = 5;
  const priorCompletionRate = 0.90;
  const completionRate = (completedProjects + priorCompletionRate * priorProjectsWeight) / (totalProjects + priorProjectsWeight);
  const projectCompletionRateScore = completionRate * 15;

  // 5. Response Time (Max 10 pts)
  // Thresholds: <1hr = 10, <=2hr = 9, <=4hr = 8, <=8hr = 6, <=12hr = 4, <=24hr = 2, >24hr = 0
  let responseTimeScore = 6; // Default to a standard baseline (8 hours) if not tracked/provided
  if (avgResponseTimeHours !== undefined && avgResponseTimeHours !== null) {
    if (avgResponseTimeHours < 1) responseTimeScore = 10;
    else if (avgResponseTimeHours <= 2) responseTimeScore = 9;
    else if (avgResponseTimeHours <= 4) responseTimeScore = 8;
    else if (avgResponseTimeHours <= 8) responseTimeScore = 6;
    else if (avgResponseTimeHours <= 12) responseTimeScore = 4;
    else if (avgResponseTimeHours <= 24) responseTimeScore = 2;
    else responseTimeScore = 0;
  }

  // 6. Portfolio Quality (Max 10 pts)
  const portfolioImagesCount = Array.isArray(profile.portfolio) ? profile.portfolio.length : 0;
  const showcase = (profile as any).projectsShowcase;
  const caseStudiesCount = Array.isArray(showcase) ? showcase.length : 0;
  const hasDescription = (profile.description?.trim().length || 0) > 20 || (profile.bio?.trim().length || 0) > 20 ? 1 : 0;
  const portfolioQualityScore = Math.min(10, Math.min(5, portfolioImagesCount) + Math.min(4, caseStudiesCount * 2) + hasDescription);

  // 7. Profile Completion (Max 10 pts)
  // Evaluate 10 key fields on the business profile
  let completionCount = 0;
  if (profile.bio && profile.bio.trim().length > 0) completionCount++;
  if (profile.avatar && profile.avatar.trim().length > 0) completionCount++;
  if (profile.coverImage && profile.coverImage.trim().length > 0) completionCount++;
  
  const hasPricing = (profile.pricingRate && profile.pricingRate.trim().length > 0) || 
                     ((profile as any).pricing && (profile as any).pricing.trim().length > 0) ||
                     (profile.priceStartingFrom && profile.priceStartingFrom.trim().length > 0);
  if (hasPricing) completionCount++;
  
  if (profile.experience && profile.experience.trim().length > 0) completionCount++;
  if (profile.workingHours || (profile as any).businessHours) completionCount++;
  if (profile.category && profile.category.trim().length > 0) completionCount++;
  if (profile.serviceRadius || (profile as any).serviceArea) completionCount++;
  if ((profile as any).skills && (profile as any).skills.length > 0) completionCount++;
  
  const hasSocials = profile.socialLinks && Object.values(profile.socialLinks).some((val) => val && val.trim().length > 0);
  if (hasSocials) completionCount++;

  const profileCompletionScore = completionCount; // 1 point per field checked (10 fields max)

  // Overall Trust Score calculation (0 - 100)
  const overall = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        identityVerificationScore +
        professionalDocumentsScore +
        clientReviewsScore +
        projectCompletionRateScore +
        responseTimeScore +
        portfolioQualityScore +
        profileCompletionScore
      )
    )
  );

  const label = getTrustLabel(overall);

  // Factors mapping
  const factors = {
    identityVerification: {
      score: Math.round(identityVerificationScore * 10) / 10,
      max: 20 as const,
      status: identityVerified ? ("verified" as const) : ("needs_improvement" as const),
    },
    professionalDocuments: {
      score: Math.round(professionalDocumentsScore * 10) / 10,
      max: 15 as const,
      status: professionalDocumentsScore === 15 ? ("verified" as const) : professionalDocumentsScore > 0 ? ("pending" as const) : ("needs_improvement" as const),
    },
    clientReviews: {
      score: Math.round(clientReviewsScore * 10) / 10,
      max: 20 as const,
      status: reviewCount >= 5 && (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) >= 4.5 ? ("verified" as const) : reviewCount > 0 ? ("pending" as const) : ("needs_improvement" as const),
    },
    projectCompletionRate: {
      score: Math.round(projectCompletionRateScore * 10) / 10,
      max: 15 as const,
      status: totalProjects >= 5 && (completedProjects / totalProjects) >= 0.95 ? ("verified" as const) : totalProjects > 0 ? ("pending" as const) : ("needs_improvement" as const),
    },
    responseTime: {
      score: Math.round(responseTimeScore * 10) / 10,
      max: 10 as const,
      status: (avgResponseTimeHours !== undefined && avgResponseTimeHours <= 2) ? ("verified" as const) : (avgResponseTimeHours !== undefined && avgResponseTimeHours <= 12) ? ("pending" as const) : ("needs_improvement" as const),
    },
    portfolioQuality: {
      score: Math.round(portfolioQualityScore * 10) / 10,
      max: 10 as const,
      status: portfolioQualityScore >= 8 ? ("verified" as const) : portfolioQualityScore >= 4 ? ("pending" as const) : ("needs_improvement" as const),
    },
    profileCompletion: {
      score: Math.round(profileCompletionScore * 10) / 10,
      max: 10 as const,
      status: profileCompletionScore >= 9 ? ("verified" as const) : profileCompletionScore >= 5 ? ("pending" as const) : ("needs_improvement" as const),
    },
  };

  const suggestions = getTrustSuggestions(profile, factors);

  return {
    overall,
    label,
    factors,
    suggestions,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Returns a human-friendly trust badge label based on the overall calculated score.
 */
export function getTrustLabel(overall: number): string {
  if (overall >= 90) return "Highly Trusted Professional";
  if (overall >= 75) return "Excellent Trust Level";
  if (overall >= 60) return "Trusted Professional";
  return "Building Trust";
}

/**
 * Derives points-based actionable recommendations dynamically from the scoring factors.
 */
export function getTrustSuggestions(
  profile: BusinessProfile,
  factors: {
    identityVerification: { score: number; max: number };
    professionalDocuments: { score: number; max: number };
    clientReviews: { score: number; max: number };
    projectCompletionRate: { score: number; max: number };
    responseTime: { score: number; max: number };
    portfolioQuality: { score: number; max: number };
    profileCompletion: { score: number; max: number };
  }
): { message: string; potentialPoints: number }[] {
  const suggestions: { message: string; potentialPoints: number }[] = [];

  // Identity Verification Suggestion
  if (factors.identityVerification.score < factors.identityVerification.max) {
    suggestions.push({
      message: "Verify your Aadhaar card identity credentials",
      potentialPoints: factors.identityVerification.max - factors.identityVerification.score,
    });
  }

  // Professional Documents Suggestion
  if (factors.professionalDocuments.score < factors.professionalDocuments.max) {
    const missing = factors.professionalDocuments.max - factors.professionalDocuments.score;
    let details = [];
    if (!profile.verifiedBadges?.gst) details.push("GST");
    if (!profile.verifiedBadges?.businessReg) details.push("Business Registration");
    if (!profile.verifiedBadges?.officeAddress) details.push("Office Address");
    if (!profile.gstNumber && !profile.documentVerifications?.gstNumber) details.push("GST Number");
    if (!profile.licenseNumber && !profile.documentVerifications?.licenseNumber) details.push("Trade License Number");

    suggestions.push({
      message: `Upload or verify business certificates (${details.slice(0, 2).join(", ")}${details.length > 2 ? "..." : ""})`,
      potentialPoints: Math.round(missing * 10) / 10,
    });
  }

  // Reviews Suggestion
  if (factors.clientReviews.score < factors.clientReviews.max) {
    suggestions.push({
      message: "Collect more positive reviews from completed clients",
      potentialPoints: Math.round((factors.clientReviews.max - factors.clientReviews.score) * 10) / 10,
    });
  }

  // Completion Rate Suggestion
  if (factors.projectCompletionRate.score < factors.projectCompletionRate.max) {
    suggestions.push({
      message: "Complete active quotation projects without cancellations",
      potentialPoints: Math.round((factors.projectCompletionRate.max - factors.projectCompletionRate.score) * 10) / 10,
    });
  }

  // Response Time Suggestion
  if (factors.responseTime.score < factors.responseTime.max) {
    suggestions.push({
      message: "Improve reply latency - reply to client project leads within 1 hour",
      potentialPoints: Math.round((factors.responseTime.max - factors.responseTime.score) * 10) / 10,
    });
  }

  // Portfolio Quality Suggestion
  if (factors.portfolioQuality.score < factors.portfolioQuality.max) {
    const portfolioImagesCount = Array.isArray(profile.portfolio) ? profile.portfolio.length : 0;
    const showcase = (profile as any).projectsShowcase;
    const caseStudiesCount = Array.isArray(showcase) ? showcase.length : 0;
    
    let tip = "Upload portfolio photos";
    if (caseStudiesCount < 2) {
      tip = "Add completed project case-studies to showcase list";
    }

    suggestions.push({
      message: `${tip} and include description details`,
      potentialPoints: Math.round((factors.portfolioQuality.max - factors.portfolioQuality.score) * 10) / 10,
    });
  }

  // Profile Completion Suggestion
  if (factors.profileCompletion.score < factors.profileCompletion.max) {
    suggestions.push({
      message: "Complete standard profile details (avatar, skills, cover banner, social links)",
      potentialPoints: Math.round((factors.profileCompletion.max - factors.profileCompletion.score) * 10) / 10,
    });
  }

  // Sort suggestions by highest impact points descending
  return suggestions.sort((a, b) => b.potentialPoints - a.potentialPoints);
}
