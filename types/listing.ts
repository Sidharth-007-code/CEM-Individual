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
  images?: string[]; // Array of base64 preview strings or image ids
  thumbnail?: string; // Quick preview thumbnail
  createdAt: any;
  updatedAt?: any;
}

