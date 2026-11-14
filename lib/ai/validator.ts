import { ListingCategory, ListingCondition } from "@/types/listing";
import {
  AIListingValidationResult,
  AIPriceEvaluation,
  AISafetyCheck,
  AIQualityCheck,
  PriceFairnessRating,
} from "./types";
import {
  ACADEMIC_BENCHMARKS,
  PROHIBITED_KEYWORDS,
  AcademicBenchmarkItem,
} from "./knowledgeBase";
import { CATEGORY_PRICE_RANGES, MIN_LISTING_IMAGES } from "@/lib/constants";

export interface ValidateListingInput {
  title: string;
  description: string;
  category: ListingCategory;
  condition: ListingCondition;
  price: number;
  imageCount?: number;
  imageSizesKb?: number[];
}

/**
 * AI Product Validation Engine
 * Runs deep content safety, price fairness, quality completeness, and auto-tagging.
 */
export function validateListingAI(input: ValidateListingInput): AIListingValidationResult {
  const cleanTitle = (input.title || "").trim();
  const cleanDesc = (input.description || "").trim();
  const combinedText = `${cleanTitle} ${cleanDesc}`.toLowerCase();
  const numericPrice = Number(input.price) || 0;
  const imageCount = input.imageCount ?? 0;

  // 1. Safety & Restricted Content Check
  const detectedFlags: string[] = [];
  PROHIBITED_KEYWORDS.forEach((item) => {
    // Regex for word boundary match
    const regex = new RegExp(`\\b${item.term}\\b`, "i");
    if (regex.test(combinedText)) {
      detectedFlags.push(`${item.term.toUpperCase()}: ${item.reason}`);
    }
  });

  const isProhibited = detectedFlags.length > 0;
  let safetyScore = 100;
  if (isProhibited) {
    safetyScore = Math.max(10, 100 - detectedFlags.length * 35);
  }

  const safetyRisk: "LOW" | "MEDIUM" | "HIGH" =
    safetyScore >= 85 ? "LOW" : safetyScore >= 50 ? "MEDIUM" : "HIGH";

  const safetyCheck: AISafetyCheck = {
    status: isProhibited ? (safetyScore < 40 ? "REJECTED" : "FLAGGED_REVIEW") : "CLEARED",
    safetyScore,
    isProhibited,
    detectedFlags,
    riskLevel: safetyRisk,
    advisoryNote: isProhibited
      ? `Detected ${detectedFlags.length} restricted item flag(s). Requires verifier safety review.`
      : "Content cleared all campus compliance and safety checks.",
  };

  // 2. Fair Price & Academic Market Value Evaluation
  const priceEval = evaluatePriceFairness(cleanTitle, cleanDesc, input.category, input.condition, numericPrice);

  // 3. Description Quality & Completeness
  const qualityCheck = evaluateQuality(cleanTitle, cleanDesc, imageCount, input.condition);

  // 4. Academic Category Suggestion
  let recommendedCategory: ListingCategory | undefined;
  const lowerTitle = cleanTitle.toLowerCase();
  if (lowerTitle.includes("calculator") || lowerTitle.includes("casio") || lowerTitle.includes("multimeter")) {
    recommendedCategory = "Electronics & Calculators";
  } else if (lowerTitle.includes("book") || lowerTitle.includes("mathematics") || lowerTitle.includes("notes") || lowerTitle.includes("grewal")) {
    recommendedCategory = "Textbooks & Notes";
  } else if (lowerTitle.includes("drafter") || lowerTitle.includes("drawing tube") || lowerTitle.includes("sheet")) {
    recommendedCategory = "Stationery & Drafting";
  } else if (lowerTitle.includes("apron") || lowerTitle.includes("lab coat") || lowerTitle.includes("crest")) {
    recommendedCategory = "Lab Equipment & Uniforms";
  } else if (lowerTitle.includes("kettle") || lowerTitle.includes("lamp") || lowerTitle.includes("mattress")) {
    recommendedCategory = "Hostel & Room Essentials";
  } else if (lowerTitle.includes("cycle") || lowerTitle.includes("bicycle")) {
    recommendedCategory = "Bicycles & Mobility";
  }

  // 5. Auto-Generated Academic Tags
  const suggestedTags = extractAcademicTags(cleanTitle, cleanDesc, input.category);

  // 6. Overall Composite Score & Verifier Action
  const overallScore = Math.round(
    safetyScore * 0.45 + qualityCheck.qualityScore * 0.35 + priceEval.fairnessConfidence * 0.2
  );

  const overallPassed =
    !isProhibited &&
    qualityCheck.qualityScore >= 45 &&
    numericPrice > 0 &&
    imageCount >= MIN_LISTING_IMAGES;

  let recommendedAction: "APPROVE" | "REQUEST_CHANGES" | "REJECT" = "APPROVE";
  if (isProhibited || safetyCheck.riskLevel === "HIGH") {
    recommendedAction = "REJECT";
  } else if (!overallPassed || imageCount < MIN_LISTING_IMAGES || qualityCheck.qualityScore < 50) {
    recommendedAction = "REQUEST_CHANGES";
  }

  const summaryBulletPoints: string[] = [];
  if (isProhibited) {
    summaryBulletPoints.push(`⚠️ Flagged: ${detectedFlags.join("; ")}`);
  }
  summaryBulletPoints.push(
    `Fair Price: ${priceEval.ratingLabel} (₹${numericPrice} vs est. ₹${priceEval.estimatedMin}-₹${priceEval.estimatedMax})`
  );
  summaryBulletPoints.push(`Listing Quality: Grade ${qualityCheck.grade} (${qualityCheck.qualityScore}/100)`);
  if (imageCount < MIN_LISTING_IMAGES) {
    summaryBulletPoints.push(`Image count shortfall: has ${imageCount}, required minimum is ${MIN_LISTING_IMAGES}`);
  }

  return {
    overallPassed,
    overallScore,
    timestamp: new Date().toISOString(),
    priceEval,
    safetyCheck,
    qualityCheck,
    recommendedCategory: recommendedCategory || input.category,
    suggestedTags,
    verifierAdvice: {
      recommendedAction,
      confidenceScore: Math.min(98, Math.max(60, overallScore)),
      summaryBulletPoints,
    },
  };
}

/**
 * Computes price benchmark and fairness rating
 */
function evaluatePriceFairness(
  title: string,
  desc: string,
  category: ListingCategory,
  condition: ListingCondition,
  price: number
): AIPriceEvaluation {
  const combined = `${title} ${desc}`.toLowerCase();

  // Look for matching specific product in knowledge base
  let benchmark: AcademicBenchmarkItem | undefined = ACADEMIC_BENCHMARKS.find((item) =>
    item.keywords.some((kw) => combined.includes(kw))
  );

  let fairMin = 0;
  let fairMax = 0;
  let avgPrice = 0;

  if (benchmark) {
    fairMin = benchmark.fairMin;
    fairMax = benchmark.fairMax;
    avgPrice = benchmark.averagePrice;

    // Condition adjustments
    if (condition === "new") {
      fairMin = Math.round(fairMin * 1.1);
      fairMax = Math.round(fairMax * 1.15);
      avgPrice = Math.round(avgPrice * 1.1);
    } else if (condition === "fair") {
      fairMin = Math.round(fairMin * 0.75);
      fairMax = Math.round(fairMax * 0.85);
      avgPrice = Math.round(avgPrice * 0.8);
    }
  } else {
    // Fallback to category range
    const catRange = CATEGORY_PRICE_RANGES[category] || { min: 100, max: 2000 };
    avgPrice = Math.round((catRange.min + catRange.max) * 0.35); // typical student secondhand discount
    fairMin = Math.round(avgPrice * 0.6);
    fairMax = Math.round(avgPrice * 1.4);
  }

  let rating: PriceFairnessRating = "FAIR_PRICE";
  let ratingLabel = "Fair Campus Price";
  let priceDeltaPercentage = 0;

  if (avgPrice > 0 && price > 0) {
    priceDeltaPercentage = Math.round(((price - avgPrice) / avgPrice) * 100);
  }

  if (price <= 0) {
    rating = "SUSPICIOUSLY_CHEAP";
    ratingLabel = "Zero or Invalid Price";
  } else if (price < fairMin * 0.4) {
    rating = "SUSPICIOUSLY_CHEAP";
    ratingLabel = "Suspiciously Low (Verify Item)";
  } else if (price <= fairMin) {
    rating = "GREAT_DEAL";
    ratingLabel = "Great Student Bargain (Below Market)";
  } else if (price <= fairMax) {
    rating = "FAIR_PRICE";
    ratingLabel = "Fair Peer Market Price";
  } else if (price <= fairMax * 1.3) {
    rating = "SLIGHTLY_HIGH";
    ratingLabel = "Slightly High for Used Item";
  } else {
    rating = "OVERPRICED";
    ratingLabel = "Overpriced for University Peer Market";
  }

  const analysisSummary = `Market benchmark for this item is typically ₹${fairMin} - ₹${fairMax} (Campus average: ₹${avgPrice}). Your price of ₹${price} is classified as ${ratingLabel}.`;

  return {
    rating,
    ratingLabel,
    estimatedMin: fairMin,
    estimatedMax: fairMax,
    averageCampusPrice: avgPrice,
    priceDeltaPercentage,
    fairnessConfidence: benchmark ? 92 : 75,
    analysisSummary,
  };
}

/**
 * Computes listing description completeness and quality grade
 */
function evaluateQuality(
  title: string,
  desc: string,
  imageCount: number,
  condition: ListingCondition
): AIQualityCheck {
  let score = 0;
  const suggestions: string[] = [];
  const strengths: string[] = [];

  // 1. Title quality
  if (title.length >= 15 && title.length <= 80) {
    score += 25;
    strengths.push("Clear, concise title with good keywords");
  } else if (title.length < 15) {
    score += 10;
    suggestions.push("Make title more descriptive (add brand, edition, or course code)");
  } else {
    score += 18;
    suggestions.push("Shorten title slightly to keep it legible on mobile feeds");
  }

  // 2. Description length
  if (desc.length >= 70) {
    score += 30;
    strengths.push("Detailed description providing good context for buyers");
  } else if (desc.length >= 30) {
    score += 20;
    suggestions.push("Elaborate on how long the item was used and what accessories are included");
  } else {
    score += 8;
    suggestions.push("Description is very brief; buyers prefer details on condition and usage history");
  }

  // 3. Image count completeness
  if (imageCount >= 3) {
    score += 25;
    strengths.push(`Good multi-angle image coverage (${imageCount} photos uploaded)`);
  } else {
    score += imageCount * 8;
    suggestions.push(`Upload at least ${MIN_LISTING_IMAGES} photos (front, back, and any wear marks)`);
  }

  // 4. Condition Transparency
  const combined = `${title} ${desc}`.toLowerCase();
  const hasConditionDetails =
    combined.includes("working") ||
    combined.includes("scratch") ||
    combined.includes("condition") ||
    combined.includes("unused") ||
    combined.includes("clean") ||
    combined.includes("tear") ||
    combined.includes("marks");

  if (hasConditionDetails) {
    score += 10;
    strengths.push("Transparent regarding physical condition & usability");
  } else {
    suggestions.push("State whether there are any cosmetic scratches, marks, or missing parts");
  }

  // 5. Syllabus & Academic Relevance
  const hasSyllabusDetails =
    combined.includes("semester") ||
    combined.includes("sem") ||
    combined.includes("vtu") ||
    combined.includes("msruas") ||
    combined.includes("course") ||
    combined.includes("edition") ||
    combined.includes("syllabus");

  if (hasSyllabusDetails) {
    score += 10;
    strengths.push("Includes university semester / syllabus details");
  } else {
    suggestions.push("Mention the target semester or department so juniors can find it");
  }

  const finalScore = Math.min(100, Math.max(10, score));
  let grade: "A+" | "A" | "B" | "C" | "NEEDS_IMPROVEMENT" = "C";
  if (finalScore >= 90) grade = "A+";
  else if (finalScore >= 80) grade = "A";
  else if (finalScore >= 65) grade = "B";
  else if (finalScore >= 50) grade = "C";
  else grade = "NEEDS_IMPROVEMENT";

  return {
    qualityScore: finalScore,
    grade,
    completenessPercentage: finalScore,
    strengths,
    suggestions,
    hasSyllabusDetails,
    hasConditionDetails,
  };
}

/**
 * Extracts relevant hashtags
 */
function extractAcademicTags(title: string, desc: string, category: ListingCategory): string[] {
  const combined = `${title} ${desc}`.toLowerCase();
  const tags: Set<string> = new Set();

  tags.add(`#${category.replace(/[^a-zA-Z]/g, "")}`);

  if (combined.includes("calculator") || combined.includes("casio")) tags.add("#CasioCalc");
  if (combined.includes("grewal") || combined.includes("mathematics")) tags.add("#EnggMaths");
  if (combined.includes("dsa") || combined.includes("algorithm")) tags.add("#DSA_CSE");
  if (combined.includes("drafter") || combined.includes("drawing")) tags.add("#EngineeringDrawing");
  if (combined.includes("lab coat") || combined.includes("apron")) tags.add("#LabKit");
  if (combined.includes("cycle") || combined.includes("bicycle")) tags.add("#CampusMobility");
  if (combined.includes("kettle") || combined.includes("hostel")) tags.add("#HostelLife");
  if (combined.includes("semester") || combined.includes("sem")) tags.add("#SemesterExams");

  tags.add("#VerifiedStudent");
  return Array.from(tags).slice(0, 5);
}
