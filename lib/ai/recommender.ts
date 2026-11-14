import { Listing } from "@/types/listing";
import { UserProfile } from "@/types/user";
import { COURSE_AFFINITY_MAP } from "./knowledgeBase";

export interface RecommendedListingItem {
  listing: Listing;
  recommendationReason: string;
  relevanceScore: number;
}

/**
 * AI Personalized Feed Recommender
 * Generates tailored product recommendations based on a student's branch, academic year, and residence.
 */
export function getPersonalizedRecommendationsAI(
  profile: UserProfile | null,
  allListings: Listing[],
  limit = 4
): RecommendedListingItem[] {
  // Only available items, excluding user's own listings
  const candidates = allListings.filter(
    (l) => l.status === "available" && (!profile || l.sellerId !== profile.uid)
  );

  if (!profile) {
    // Guest or unlogged-in: return newest top-quality listings
    return candidates.slice(0, limit).map((l) => ({
      listing: l,
      recommendationReason: "Campus Trending Gear",
      relevanceScore: 0.85,
    }));
  }

  const courseLower = (profile.course || "").toLowerCase();
  const yearLower = (profile.year || "").toLowerCase();
  const campusLower = (profile.campus || "").toLowerCase();

  const results: RecommendedListingItem[] = [];

  for (const item of candidates) {
    let score = 0.5; // baseline
    const reasons: string[] = [];

    const titleLower = item.title.toLowerCase();

    // 1. Branch / Faculty Affinity
    let matchedBranch = false;
    Object.entries(COURSE_AFFINITY_MAP).forEach(([keyword, categories]) => {
      if (courseLower.includes(keyword)) {
        if (categories.includes(item.category)) {
          score += 0.3;
          matchedBranch = true;
          reasons.push(`Curated for ${profile.course?.split("-")[0]?.trim() || "Your Branch"}`);
        }
      }
    });

    // 2. Academic Year Specifics
    if (yearLower.includes("1st") || yearLower.includes("freshman")) {
      // 1st years need foundational textbooks, drafters, and calculators
      if (
        titleLower.includes("grewal") ||
        titleLower.includes("calculator") ||
        titleLower.includes("drafter") ||
        titleLower.includes("lab coat")
      ) {
        score += 0.35;
        reasons.push("1st Year Core Academic Kit");
      }
    } else if (yearLower.includes("4th") || yearLower.includes("senior")) {
      if (titleLower.includes("dsa") || titleLower.includes("interview") || titleLower.includes("project")) {
        score += 0.25;
        reasons.push("Senior Year Placement & Projects");
      }
    }

    // 3. Hostel Living Affinity
    if (campusLower.includes("hostel")) {
      if (item.category === "Hostel & Room Essentials" || titleLower.includes("kettle") || titleLower.includes("lamp")) {
        score += 0.2;
        reasons.push("Hostel Living Essential");
      }
    }

    // Default reason fallback
    const primaryReason = reasons[0] || `Popular in ${item.category}`;

    results.push({
      listing: item,
      recommendationReason: primaryReason,
      relevanceScore: Math.min(1.0, score),
    });
  }

  // Sort by score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

/**
 * AI Similar Products Finder
 * Identifies alternative or complementary products for the active listing.
 */
export function getSimilarListingsAI(
  targetListing: Listing,
  allListings: Listing[],
  limit = 3
): RecommendedListingItem[] {
  const candidates = allListings.filter(
    (l) => l.id !== targetListing.id && l.status === "available"
  );

  const targetTokens = targetListing.title.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const targetPrice = targetListing.price;

  const results: RecommendedListingItem[] = [];

  for (const item of candidates) {
    let score = 0;
    const reasons: string[] = [];

    // Category match
    if (item.category === targetListing.category) {
      score += 0.45;
      reasons.push(`Similar item in ${targetListing.category}`);
    }

    // Title token overlap
    const itemTokens = item.title.toLowerCase().split(/\s+/);
    let overlap = 0;
    for (const t of targetTokens) {
      if (itemTokens.includes(t)) {
        overlap++;
      }
    }

    if (overlap > 0) {
      score += Math.min(0.4, overlap * 0.15);
      reasons.push("Related academic subject / model");
    }

    // Price proximity (within 35%)
    if (targetPrice > 0) {
      const priceDiffRatio = Math.abs(item.price - targetPrice) / targetPrice;
      if (priceDiffRatio <= 0.35) {
        score += 0.15;
      }
    }

    if (score > 0.4) {
      results.push({
        listing: item,
        recommendationReason: reasons[0] || "Students Also Viewed",
        relevanceScore: Math.min(1.0, score),
      });
    }
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

