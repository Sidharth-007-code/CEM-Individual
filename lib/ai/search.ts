import { Listing, ListingCategory, ListingCondition } from "@/types/listing";
import { AISearchIntent } from "./types";
import { SYNONYM_DICTIONARY } from "./knowledgeBase";
import { CATEGORIES } from "@/lib/constants";

/**
 * Natural Language Query Parser
 * Extracts price bounds, condition preferences, category hints, and synonym expansions.
 */
export function parseSearchIntentAI(rawQuery: string): AISearchIntent {
  const q = (rawQuery || "").toLowerCase().trim();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);

  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  let detectedCondition: ListingCondition | undefined;
  let detectedCategory: ListingCategory | undefined;
  const syllabusKeywords: string[] = [];

  // 1. Extract Price Intent (e.g. "under 500", "below 1k", "<= 800", "less than 600")
  const underMatch = q.match(/(?:under|below|less than|within|max|<=?)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:k)?)/i);
  if (underMatch) {
    let valStr = underMatch[1].toLowerCase();
    if (valStr.endsWith("k")) {
      maxPrice = parseFloat(valStr) * 1000;
    } else {
      maxPrice = parseInt(valStr, 10);
    }
  }

  // Range match: "between 200 and 600" or "200 to 500"
  const rangeMatch = q.match(/(?:between|from)?\s*(\d+)\s*(?:to|and|-)\s*(\d+)/i);
  if (rangeMatch) {
    minPrice = parseInt(rangeMatch[1], 10);
    maxPrice = parseInt(rangeMatch[2], 10);
  }

  // 2. Extract Condition Intent
  if (q.includes("brand new") || q.includes("unopened") || q.includes("sealed")) {
    detectedCondition = "new";
  } else if (q.includes("like new") || q.includes("mint")) {
    detectedCondition = "like_new";
  } else if (q.includes("good condition")) {
    detectedCondition = "good";
  } else if (q.includes("fair") || q.includes("usable")) {
    detectedCondition = "fair";
  }

  // 3. Extract Category Hint
  if (q.includes("calculator") || q.includes("calc") || q.includes("electronics") || q.includes("casio")) {
    detectedCategory = "Electronics & Calculators";
  } else if (q.includes("book") || q.includes("notes") || q.includes("maths") || q.includes("textbook") || q.includes("author")) {
    detectedCategory = "Textbooks & Notes";
  } else if (q.includes("drafter") || q.includes("drafting") || q.includes("drawing tube") || q.includes("sheet")) {
    detectedCategory = "Stationery & Drafting";
  } else if (q.includes("lab coat") || q.includes("apron") || q.includes("multimeter") || q.includes("stethoscope")) {
    detectedCategory = "Lab Equipment & Uniforms";
  } else if (q.includes("kettle") || q.includes("lamp") || q.includes("hostel") || q.includes("mattress")) {
    detectedCategory = "Hostel & Room Essentials";
  } else if (q.includes("cycle") || q.includes("bicycle") || q.includes("bike")) {
    detectedCategory = "Bicycles & Mobility";
  }

  // 4. Extract Syllabus / Semester hints
  if (q.includes("sem") || q.includes("semester") || q.includes("vtu") || q.includes("msruas") || q.includes("engineering")) {
    syllabusKeywords.push("Academic Syllabus");
  }

  const isSpecificModel = q.includes("991") || q.includes("classwiz") || q.includes("grewal") || q.includes("roadeo");

  return {
    rawQuery,
    cleanedTokens: tokens,
    detectedCategory,
    detectedCondition,
    maxPrice,
    minPrice,
    syllabusKeywords,
    isSpecificModel,
  };
}

export interface RankedListingResult {
  listing: Listing;
  relevanceScore: number; // 0 to 1
  matchReasons: string[];
}

/**
 * AI Semantic Matcher and Ranker
 * Evaluates listings using token similarity, synonym expansion, and NLP intent parsing.
 */
export function rankListingsAI(rawQuery: string, listings: Listing[]): RankedListingResult[] {
  if (!rawQuery.trim()) {
    return listings.map((l) => ({ listing: l, relevanceScore: 1, matchReasons: ["Notice Board Feed"] }));
  }

  const intent = parseSearchIntentAI(rawQuery);
  const qTokens = intent.cleanedTokens;

  // Build expanded synonyms
  const searchTerms = new Set<string>(qTokens);
  qTokens.forEach((tok) => {
    Object.entries(SYNONYM_DICTIONARY).forEach(([canonical, syns]) => {
      if (canonical === tok || syns.includes(tok)) {
        searchTerms.add(canonical);
        syns.forEach((s) => searchTerms.add(s));
      }
    });
  });

  const expandedList = Array.from(searchTerms);

  const results: RankedListingResult[] = [];

  for (const item of listings) {
    let score = 0;
    const matchReasons: string[] = [];

    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    const categoryLower = item.category.toLowerCase();

    // 1. Direct Title & Exact Phrase matches (highest weight)
    if (titleLower.includes(rawQuery.toLowerCase())) {
      score += 0.5;
      matchReasons.push("Exact title match");
    }

    // 2. Token & Synonym overlap
    let tokenMatches = 0;
    for (const term of expandedList) {
      if (titleLower.includes(term)) {
        score += 0.2;
        tokenMatches++;
      } else if (descLower.includes(term)) {
        score += 0.08;
        tokenMatches++;
      } else if (categoryLower.includes(term)) {
        score += 0.05;
        tokenMatches++;
      }
    }

    if (tokenMatches > 0 && !matchReasons.includes("Exact title match")) {
      matchReasons.push(`Matched ${tokenMatches} keyword/synonym signal(s)`);
    }

    // 3. Category Intent Match
    if (intent.detectedCategory && item.category === intent.detectedCategory) {
      score += 0.2;
      matchReasons.push(`Aligned with ${intent.detectedCategory}`);
    }

    // 4. Price Intent Filter & Boosting
    if (intent.maxPrice !== undefined) {
      if (item.price <= intent.maxPrice) {
        score += 0.15;
        matchReasons.push(`Under budget (₹${item.price} <= ₹${intent.maxPrice})`);
      } else {
        // Penalize slightly if exceeding explicit max price intent
        score -= 0.35;
      }
    }

    if (intent.minPrice !== undefined) {
      if (item.price >= intent.minPrice) {
        score += 0.1;
      } else {
        score -= 0.2;
      }
    }

    // 5. Condition Intent
    if (intent.detectedCondition && item.condition === intent.detectedCondition) {
      score += 0.1;
      matchReasons.push(`Condition matched (${item.condition})`);
    }

    // Only include if score > 0
    if (score > 0.05) {
      results.push({
        listing: item,
        relevanceScore: Math.min(1, Math.max(0.1, score)),
        matchReasons,
      });
    }
  }

  // Sort descending by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results;
}

