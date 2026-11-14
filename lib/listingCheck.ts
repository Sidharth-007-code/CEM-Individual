import { CATEGORY_PRICE_RANGES, MIN_LISTING_IMAGES, COMPRESSED_IMAGE_TARGET_SIZE_KB } from "@/lib/constants";
import { ListingCategory, ListingCheckResult, ListingCondition } from "@/types/listing";
import { validateListingAI } from "@/lib/ai";

export interface ListingCheckInput {
  title: string;
  description: string;
  category: ListingCategory;
  condition: ListingCondition;
  price: number;
  imageCount: number;
  imageSizesKb?: number[];
  images?: Array<{ dataUrl?: string; name?: string; sizeKb?: number; width?: number; height?: number }>;
}

/**
 * [Mocked Automated Advisory Linter]
 * Rule-based validation engine that evaluates listing metadata against university
 * fair-trade bounds and image standards. Outputs advisory remarks to guide human verifiers.
 */
export function runAutomatedListingCheck(input: ListingCheckInput): ListingCheckResult {
  const reasons: string[] = [];

  // 1. Mandatory Image Count Rule (FR-06)
  if (!input.imageCount || input.imageCount < MIN_LISTING_IMAGES) {
    reasons.push(
      `Media requirement unmet: Provided ${input.imageCount || 0} image(s); minimum ${MIN_LISTING_IMAGES} required for quality verification.`
    );
  }

  // 2. Title & Description Quality Bounds
  if (!input.title || input.title.trim().length < 5) {
    reasons.push("Title too brief: Must be at least 5 characters.");
  } else if (input.title.trim().length > 100) {
    reasons.push("Title exceeds maximum limit of 100 characters.");
  }

  if (!input.description || input.description.trim().length < 15) {
    reasons.push("Description too brief: Must be at least 15 characters detailing item condition and contents.");
  }

  // 3. Category Price Band Check
  const categoryBounds = CATEGORY_PRICE_RANGES[input.category];
  if (!categoryBounds) {
    reasons.push(`Unrecognized category: "${input.category}".`);
  } else {
    if (typeof input.price !== "number" || isNaN(input.price) || input.price <= 0) {
      reasons.push("Price must be a positive number greater than ₹0.");
    } else if (input.price < categoryBounds.min) {
      reasons.push(
        `Advisory: Price (₹${input.price}) is unusually low for ${input.category} (standard min: ₹${categoryBounds.min}). Verifier must confirm item is legitimate.`
      );
    } else if (input.price > categoryBounds.max) {
      reasons.push(
        `Advisory: Price (₹${input.price}) exceeds campus ceiling (₹${categoryBounds.max}) for ${input.category}. Verifier must check for price gouging.`
      );
    }
  }

  // 4. Image Size Payload Bounds (<150KB recommended)
  if (input.imageSizesKb && input.imageSizesKb.length > 0) {
    const oversizedImages = input.imageSizesKb.filter((s) => s > COMPRESSED_IMAGE_TARGET_SIZE_KB);
    if (oversizedImages.length > 0) {
      reasons.push(
        `Advisory: ${oversizedImages.length} image(s) exceed target ${COMPRESSED_IMAGE_TARGET_SIZE_KB}KB limit.`
      );
    }
  }

  // Run deep AI validation engine
  const aiResult = validateListingAI(input);

  // If AI detected restricted/prohibited items, add as reasons
  if (aiResult.safetyCheck.isProhibited) {
    aiResult.safetyCheck.detectedFlags.forEach((flag) => {
      reasons.push(`AI Safety Alert: ${flag}`);
    });
  }

  // If AI image analysis detected mismatch or authenticity risks, add as reasons
  if (aiResult.imageAnalysis) {
    if (!aiResult.imageAnalysis.isMatch) {
      reasons.push(`AI Vision Alert: ${aiResult.imageAnalysis.matchExplanation}`);
    }
    if (!aiResult.imageAnalysis.isGenuine) {
      aiResult.imageAnalysis.riskFlags.forEach((rf) => {
        reasons.push(`AI Authenticity Alert: ${rf}`);
      });
    }
  }

  return {
    passed: reasons.length === 0,
    reasons,
    aiResult,
  };
}

