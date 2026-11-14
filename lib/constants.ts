import { ListingCategory } from "@/types/listing";

export const ALLOWED_EMAIL_DOMAIN = "msruas.ac.in";

export const CATEGORIES = [
  "Textbooks & Notes",
  "Electronics & Calculators",
  "Hostel & Room Essentials",
  "Lab Equipment & Uniforms",
  "Stationery & Drafting",
  "Bicycles & Mobility",
  "Miscellaneous",
] as const;

export const CATEGORY_PRICE_RANGES: Record<ListingCategory, { min: number; max: number }> = {
  "Textbooks & Notes": { min: 50, max: 5000 },
  "Electronics & Calculators": { min: 200, max: 65000 },
  "Hostel & Room Essentials": { min: 50, max: 10000 },
  "Lab Equipment & Uniforms": { min: 100, max: 4000 },
  "Stationery & Drafting": { min: 20, max: 2500 },
  "Bicycles & Mobility": { min: 500, max: 15000 },
  "Miscellaneous": { min: 20, max: 20000 },
};

export const MEETUP_SPOTS = [
  "University Central Library Entrance",
  "Main Campus Canteen (GF)",
  "Campus Main Gate Security Booth",
  "Admin Block Steps (East Wing)",
] as const;

export type MeetupSpot = (typeof MEETUP_SPOTS)[number];

export const MAX_REPORTS_BEFORE_HIDE = 3;
export const MIN_LISTING_IMAGES = 3;
export const MAX_IMAGE_FILE_SIZE_BYTES = 1024 * 1024 * 5; // 5MB raw upload limit before compression
export const COMPRESSED_IMAGE_TARGET_SIZE_KB = 150;
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

