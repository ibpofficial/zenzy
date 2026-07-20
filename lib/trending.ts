export interface WorkerDocument {
  id: string;
  uid?: string;
  name: string;
  category: string;
  stars?: number;
  reviewsCount?: number;
  servicesGiven?: number;
  bookingsCount?: number;
  completedBookings?: number;
  profileViews?: number;
  viewsCount?: number;
  visitedCount?: number;
  premium?: boolean;
  topRated?: boolean;
  status?: string;
  serviceArea?: string;
  avatar?: string;
  coverImage?: string;
  createdAt?: string;
  lastStatusChange?: string;
  lastScoreUpdate?: string;
  documentStatus?: string;
  trendingScore?: number;
  [key: string]: any;
}

/**
 * Compute recency-decay trending score for a candidate worker.
 *
 * Scoring Formula:
 * - rating (stars * 15): Baseline service quality score (0-75 pts)
 * - bookings (bookingsCount * 1.5): Active customer booking volume track record
 * - profileViews (visitedCount * 0.2): Popularity / profile visit interest data
 * - servicesGiven (count * 0.5): Completed services track record
 * - premium status (+12 pts): Platform verified premium status
 * - topRated status (+8 pts): High review satisfaction badge
 * - recencyWeight (25 / (1 + daysSinceLastActivity)): Strong recency decay ensuring active pros trend
 * - status === "Available" (+10 pts): Boosts currently available pros for immediate booking
 */
export function calculateTrendingScore(w: WorkerDocument, nowMs: number = Date.now()): number {
  const rating = w.stars ?? 4.0;
  const bookings = w.bookingsCount ?? w.completedBookings ?? 0;
  const views = w.profileViews ?? w.viewsCount ?? w.visitedCount ?? 0;
  const servicesGiven = w.servicesGiven ?? w.reviewsCount ?? 0;
  const isPremium = Boolean(w.premium);
  const isTopRated = Boolean(w.topRated);
  const isAvailable = w.status === "Available";

  // Determine recency of last activity or update
  const lastActivityStr = w.lastScoreUpdate || w.lastStatusChange || w.createdAt;
  const lastActivityMs = lastActivityStr ? new Date(lastActivityStr).getTime() : nowMs - (30 * 24 * 60 * 60 * 1000);
  const daysSinceLastActivity = Math.max(0, (nowMs - lastActivityMs) / (1000 * 60 * 60 * 24));

  // Time-decay formula: recencyWeight decays smoothly from 1.0 down to ~0.0
  const recencyWeight = 1 / (1 + daysSinceLastActivity);

  const score =
    (rating * 15) +
    (bookings * 1.5) +
    (views * 0.2) +
    (servicesGiven * 0.5) +
    (isPremium ? 12 : 0) +
    (isTopRated ? 8 : 0) +
    (recencyWeight * 25) +
    (isAvailable ? 10 : 0);

  return Math.round(score * 100) / 100;
}

/**
 * Rank candidates by recency-decay trending score and apply category diversity filtering.
 * Selects top-scored worker per unique category first, then fills remaining slots by score.
 */
export function processTrendingWorkers(workers: WorkerDocument[], limitCount: number = 6): WorkerDocument[] {
  if (workers.length === 0) return [];

  const nowMs = Date.now();

  // 1. Calculate trending score for all candidates
  const scoredWorkers = workers.map((w) => ({
    ...w,
    trendingScore: calculateTrendingScore(w, nowMs),
  }));

  // 2. Sort candidate pool by trending score descending
  scoredWorkers.sort((a, b) => b.trendingScore - a.trendingScore);

  // 3. Category diversity filtering: pick top worker per unique category first
  const selected: WorkerDocument[] = [];
  const seenCategories = new Set<string>();
  const remaining: WorkerDocument[] = [];

  for (const worker of scoredWorkers) {
    const cat = (worker.category || "General").toLowerCase();
    if (!seenCategories.has(cat)) {
      seenCategories.add(cat);
      selected.push(worker);
    } else {
      remaining.push(worker);
    }
  }

  // 4. If diverse selection has room, fill remaining slots from sorted pool
  if (selected.length < limitCount) {
    for (const worker of remaining) {
      if (selected.length >= limitCount) break;
      selected.push(worker);
    }
  }

  // Cap final output to target limit (default 6)
  return selected.slice(0, limitCount);
}
