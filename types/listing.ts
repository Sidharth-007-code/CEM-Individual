import { AIListingValidationResult } from "@/lib/ai/types";

export const CATEGORIES = [
  "Textbooks & Notes",
  "Electronics & Calculators",
  "Hostel & Room Essentials",
  "Lab Equipment & Uniforms",
  "Stationery & Drafting",
  "Bicycles & Mobility",
  "Miscellaneous",
] as const;

export type ListingCategory = (typeof CATEGORIES)[number];

export type ListingCondition = "new" | "like_new" | "good" | "fair";

export type ListingStatus =
  | "draft"
  | "pending"
  | "needs_changes"
  | "rejected"
  | "available"
  | "sold"
  | "hidden";

export interface ListingCheckResult {
  passed: boolean;
  reasons: string[];
  aiResult?: AIListingValidationResult;
}

export interface ListingImage {
  id: string;
  dataUrl: string; // Base64 data URL
  createdAt?: any;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerPhone?: string;
  title: string;
  description: string;
  category: ListingCategory;
  condition: ListingCondition;
  price: number;
  status: ListingStatus;
  checkResult?: ListingCheckResult;
  verifierId?: string;
  verifierNote?: string;
  reportCount: number;
  aiValidation?: AIListingValidationResult;
  aiTags?: string[];
  images?: string[]; // Array of base64 preview strings or image ids
  thumbnail?: string; // Quick preview thumbnail
  isDemo?: boolean; // Local-only preview listing; never persisted to Firestore
  isPresentationDemo?: boolean; // Compatibility with previously seeded presentation previews
  createdAt: any;
  updatedAt?: any;
}

