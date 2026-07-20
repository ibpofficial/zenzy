import Fuse, { type IFuseOptions } from "fuse.js";

export interface SearchIndexItem {
  id: string;
  name: string;
  category: string;
  type: "service" | "rent" | "worker" | "product";
  keywords: string[];
  icon?: string;
  serviceArea?: string;
  avatar?: string;
  slug?: string;
  workerId?: string;
  rating?: number;
  servicesGiven?: number;
}

export interface SpellingSuggestion {
  item: SearchIndexItem;
  query: string;
  correctedWord: string;
}

export interface SearchResultOutput {
  suggestions: SearchIndexItem[];
  spellingSuggestion: SpellingSuggestion | null;
}

const CLICK_HISTORY_KEY = "zenzy_search_click_history";

/**
 * Save user clicked suggestion to localStorage to boost personalization in future queries.
 */
export function recordSearchClick(queryStr: string, item: SearchIndexItem): void {
  if (typeof window === "undefined" || !queryStr.trim()) return;
  try {
    const qLower = queryStr.toLowerCase().trim();
    const raw = localStorage.getItem(CLICK_HISTORY_KEY);
    const history: Record<string, { itemId: string; name: string; clicks: number; updatedAt: number }> = raw
      ? JSON.parse(raw)
      : {};

    const key = `${qLower}::${item.id}`;
    const existing = history[key] || { itemId: item.id, name: item.name, clicks: 0, updatedAt: Date.now() };

    history[key] = {
      ...existing,
      clicks: existing.clicks + 1,
      updatedAt: Date.now(),
    };

    // Keep top 50 search click history items
    const entries = Object.entries(history)
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
      .slice(0, 50);

    localStorage.setItem(CLICK_HISTORY_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (err) {
    console.error("Failed to record search click:", err);
  }
}

/**
 * Get click history boost score (0.0 to 0.25) based on past user interaction.
 */
function getClickHistoryBoost(queryStr: string, item: SearchIndexItem): number {
  if (typeof window === "undefined" || !queryStr.trim()) return 0;
  try {
    const qLower = queryStr.toLowerCase().trim();
    const raw = localStorage.getItem(CLICK_HISTORY_KEY);
    if (!raw) return 0;

    const history: Record<string, { itemId: string; name: string; clicks: number }> = JSON.parse(raw);
    const key = `${qLower}::${item.id}`;
    const record = history[key];

    if (record && record.clicks > 0) {
      return Math.min(0.25, record.clicks * 0.1);
    }
  } catch (err) {
    // Ignore storage parse error
  }
  return 0;
}

/**
 * Fuse.js fuzzy engine options with weighted fields.
 */
const FUSE_OPTIONS: IFuseOptions<SearchIndexItem> = {
  keys: [
    { name: "name", weight: 0.7 },
    { name: "category", weight: 0.3 },
    { name: "keywords", weight: 0.3 },
    { name: "serviceArea", weight: 0.2 },
  ],
  threshold: 0.35, // 0.35 threshold balances typo tolerance with precision
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

/**
 * Perform weighted fuzzy search with blended relevance score ranking.
 * Blends Fuse score + Prefix Bonus + Location Bonus + Recent Search Bonus + Click History Boost.
 */
export function performFuzzySearch(
  queryStr: string,
  items: SearchIndexItem[],
  userLocation: string = "",
  recentSearches: string[] = []
): SearchResultOutput {
  if (!queryStr.trim() || items.length === 0) {
    return { suggestions: [], spellingSuggestion: null };
  }

  const queryClean = queryStr.toLowerCase().trim();
  const fuse = new Fuse(items, FUSE_OPTIONS);
  const rawResults = fuse.search(queryClean);

  if (rawResults.length === 0) {
    return { suggestions: [], spellingSuggestion: null };
  }

  const userLocClean = userLocation.toLowerCase().trim();

  // Score & rank candidates
  const scoredCandidates = rawResults.map((res) => {
    const item = res.item;
    // Fuse score: 0 is exact match, 1 is total mismatch. Convert to base relevance (0..1)
    const baseRelevance = 1 - (res.score ?? 0.5);

    const nameLower = item.name.toLowerCase();
    const categoryLower = item.category.toLowerCase();
    const kwMatch = item.keywords.some((kw) => kw.toLowerCase().startsWith(queryClean));

    // (a) Exact / Prefix match boost
    let prefixBoost = 0;
    if (nameLower === queryClean) {
      prefixBoost = 0.35;
    } else if (nameLower.startsWith(queryClean) || kwMatch) {
      prefixBoost = 0.25;
    } else if (categoryLower.startsWith(queryClean)) {
      prefixBoost = 0.18;
    }

    // (b) Location relevance boost
    let locationBoost = 0;
    if (userLocClean && item.serviceArea) {
      const areaLower = item.serviceArea.toLowerCase();
      if (areaLower.includes(userLocClean) || userLocClean.includes(areaLower)) {
        locationBoost = 0.15;
      }
    }

    // (c) Recent search history boost
    let recentBoost = recentSearches.some((s) => s.toLowerCase().includes(queryClean) || nameLower.includes(s.toLowerCase()))
      ? 0.10
      : 0;

    // (d) Click history personalization boost
    const clickBoost = getClickHistoryBoost(queryClean, item);

    // Blended final score
    const blendedScore = baseRelevance + prefixBoost + locationBoost + recentBoost + clickBoost;

    return {
      item,
      fuseScore: res.score ?? 0.5,
      blendedScore,
      isExactPrefix: prefixBoost > 0,
    };
  });

  // Sort by blended score descending
  scoredCandidates.sort((a, b) => b.blendedScore - a.blendedScore);

  const topSuggestions = scoredCandidates.slice(0, 6).map((c) => c.item);

  // Drive "Did you mean X?" spelling correction:
  // Trigger when top candidate is a fuzzy match without strong exact prefix
  let spellingSuggestion: SpellingSuggestion | null = null;
  const topCandidate = scoredCandidates[0];

  if (topCandidate && !topCandidate.isExactPrefix && topCandidate.fuseScore <= 0.35) {
    spellingSuggestion = {
      item: topCandidate.item,
      query: topCandidate.item.name,
      correctedWord: topCandidate.item.name,
    };
  }

  return {
    suggestions: topSuggestions,
    spellingSuggestion,
  };
}
