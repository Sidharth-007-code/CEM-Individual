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

export const STUDY_YEARS = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "Postgraduate / Master's",
  "Research Scholar / PhD",
  "Faculty / Staff",
] as const;

export const CAMPUS_LOCATIONS = [
  "Gnanagangothri Campus (Mathikere)",
  "Peenya Campus (Ramaiah Technology)",
  "Ganga Boys Hostel",
  "Kaveri Girls Hostel",
  "Yamuna Hostel",
  "Netravathi Hostel",
  "Day Scholar (Off-Campus / Mathikere)",
  "Day Scholar (Off-Campus / Yelahanka / New BEL Rd)",
] as const;

export const POPULAR_DEPARTMENTS = [
  "B.Tech - Computer Science & Engineering",
  "B.Tech - Artificial Intelligence & Machine Learning",
  "B.Tech - Electronics & Communication",
  "B.Tech - Mechanical & Aerospace Engineering",
  "B.Tech - Civil & Environmental Engineering",
  "B.Des - Product & Industrial Design",
  "B.Des - Fashion & Lifestyle Design",
  "B.Pharm - Pharmacy",
  "Pharm.D - Doctor of Pharmacy",
  "BBA / MBA - Management Studies",
  "B.Com - Accounting & Finance",
  "BDS / MDS - Dental Sciences",
  "Faculty of Hospitality Management (FHMCT)",
  "Allied Health Sciences",
  "Other University Department",
] as const;

export const PRESET_AVATARS = [
  { id: "avatar-grad", label: "Graduate Cap", emoji: "🎓", bg: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "avatar-code", label: "Coder", emoji: "💻", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "avatar-science", label: "Scientist", emoji: "🔬", bg: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "avatar-design", label: "Designer", emoji: "🎨", bg: "bg-pink-100 text-pink-800 border-pink-300" },
  { id: "avatar-books", label: "Scholar", emoji: "📚", bg: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "avatar-robot", label: "Robotics", emoji: "🤖", bg: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "avatar-rocket", label: "Innovator", emoji: "🚀", bg: "bg-saffron-100 text-saffron-800 border-saffron-300" },
  { id: "avatar-coffee", label: "Night Owl", emoji: "☕", bg: "bg-stone-100 text-stone-800 border-stone-300" },
] as const;

