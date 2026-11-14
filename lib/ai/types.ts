import { ListingCategory, ListingCondition } from "@/types/listing";

export type PriceFairnessRating = "GREAT_DEAL" | "FAIR_PRICE" | "SLIGHTLY_HIGH" | "OVERPRICED" | "SUSPICIOUSLY_CHEAP";

export type SafetyStatus = "CLEARED" | "FLAGGED_REVIEW" | "REJECTED";

export interface AIPriceEvaluation {
  rating: PriceFairnessRating;
  ratingLabel: string;
  estimatedMin: number;
  estimatedMax: number;
  averageCampusPrice: number;
  priceDeltaPercentage: number;
  fairnessConfidence: number; // 0 to 100
  analysisSummary: string;
}

export interface AISafetyCheck {
  status: SafetyStatus;
  safetyScore: number; // 0 to 100 (100 is completely safe)
  isProhibited: boolean;
  detectedFlags: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  advisoryNote: string;
}

export interface AIQualityCheck {
  qualityScore: number; // 0 to 100
  grade: "A+" | "A" | "B" | "C" | "NEEDS_IMPROVEMENT";
  completenessPercentage: number;
  strengths: string[];
  suggestions: string[];
  hasSyllabusDetails: boolean;
  hasConditionDetails: boolean;
}

export interface AIImageAnalysisResult {
  isGenuine: boolean;
  authenticityScore: number; // 0 - 100
  authenticityVerdict: "GENUINE_STUDENT_PHOTO" | "SUSPICIOUS_STOCK_PHOTO" | "POOR_QUALITY_IMAGE" | "UNVERIFIED";
  genuineSignals: string[];
  riskFlags: string[];
  detectedVisualCategory: string;
  detectedVisualItem: string;
  isMatch: boolean;
  matchConfidence: number; // 0 - 100
  matchStatus: "VERIFIED_MATCH" | "LIKELY_MATCH" | "POTENTIAL_MISMATCH" | "CRITICAL_MISMATCH";
  matchExplanation: string;
  priceEstimate: {
    suggestedPrice: number;
    fairMin: number;
    fairMax: number;
    confidence: number;
    reasoning: string;
  };
}

export interface AIListingValidationResult {
  overallPassed: boolean;
  overallScore: number; // 0 to 100
  timestamp: string;
  priceEval: AIPriceEvaluation;
  safetyCheck: AISafetyCheck;
  qualityCheck: AIQualityCheck;
  imageAnalysis?: AIImageAnalysisResult;
  recommendedCategory?: ListingCategory;
  suggestedTags: string[];
  verifierAdvice: {
    recommendedAction: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
    confidenceScore: number;
    summaryBulletPoints: string[];
  };
}

export interface AISearchIntent {
  rawQuery: string;
  cleanedTokens: string[];
  detectedCategory?: ListingCategory;
  detectedCondition?: ListingCondition;
  maxPrice?: number;
  minPrice?: number;
  syllabusKeywords: string[];
  isSpecificModel: boolean;
}

export interface AISearchResultItem {
  id: string;
  relevanceScore: number; // 0 to 1
  matchedReasons: string[];
}

export interface AIEnhanceDraftInput {
  title: string;
  rawNotes?: string;
  notes?: string;
  category: ListingCategory;
  condition: ListingCondition;
  price?: number;
  images?: Array<{ dataUrl?: string; name?: string }>;
}

export interface AIEnhancedListingOutput {
  polishedTitle: string;
  polishedDescription: string;
  suggestedPrice: number;
  suggestedCategory: ListingCategory;
  suggestedCondition: ListingCondition;
  keyFeatures: string[];
  academicTags: string[];
  imageAnalysis?: AIImageAnalysisResult;
}
