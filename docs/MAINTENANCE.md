# Software Maintenance Manual - Campus Marketplace

**Course**: CSC203B Software Development Fundamentals  
**Purpose**: Step-by-step instructions for live operational modifications during examiner assessment and grading demonstrations.

---

## 1. How to Add a New Category

### Objective
Add a new category (e.g., `"Sports & Fitness"`) to the marketplace so students can select it when creating listings and filter by it in search.

### Files to Modify
1. **`lib/constants.ts`**:
   Locate `CATEGORIES` array (around lines 5-20):
   ```typescript
   export const CATEGORIES = [
     "Textbooks & Study Materials",
     "Electronics & Calculators",
     "Hostel & Room Essentials",
     "Lab Equipment & Uniforms",
     "Stationery & Drafting",
     "Sports & Fitness", // <-- Add new category here
     "Bicycles & Mobility",
     "Miscellaneous",
   ] as const;
   ```
2. **`lib/listingCheck.ts`**:
   Add price verification thresholds for the new category in `CATEGORY_PRICE_RANGES`:
   ```typescript
   "Sports & Fitness": { min: 50, max: 8000 },
   ```

### Verification
- Navigate to `/listings/new` -> Observe new category in dropdown.
- Select category and verify appropriate price bounds during client validation.
- Navigate to `/browse` -> Verify category filter button appears and filters correctly.

---

## 2. How to Modify a Category Price Range

### Objective
Adjust the upper or lower warning threshold for an existing category (e.g., raise maximum textbook price ceiling from ₹5,000 to ₹7,500 due to revised semester syllabus).

### Files to Modify
1. **`lib/listingCheck.ts`**:
   Locate `CATEGORY_PRICE_RANGES` (around lines 15-30):
   ```typescript
   export const CATEGORY_PRICE_RANGES: Record<ListingCategory, { min: number; max: number }> = {
     "Textbooks & Study Materials": { min: 50, max: 7500 }, // <-- Changed max from 5000 to 7500
     // ...
   };
   ```

### Verification
- Run unit test: `npm run test:unit`
- Create a textbook listing priced at ₹6,000. Observe that `lib/listingCheck.ts` now flags it as `passed: true` rather than advisory price warning.

---

## 3. How to Change the Report Auto-Hide Threshold

### Objective
Change the automated listing moderation threshold from `3` reports to `5` reports before a listing is automatically hidden from public search.

### Files to Modify
1. **`lib/constants.ts`**:
   Locate `MAX_REPORTS_BEFORE_HIDE` (around line 35):
   ```typescript
   export const MAX_REPORTS_BEFORE_HIDE = 5; // <-- Changed from 3 to 5
   ```
2. **`components/listings/ReportModal.tsx`** or **`lib/reports.ts`**:
   Confirm the reporting trigger references `MAX_REPORTS_BEFORE_HIDE`.

### Verification
- From student account A, submit report 1. Listing status remains `available`.
- From student account B, submit report 2. Listing status remains `available`.
- Verify listing is only hidden when `reportCount >= MAX_REPORTS_BEFORE_HIDE`.

---

## 4. How to Add a New Verified Meetup Spot

### Objective
Add a new safe, CCTV-monitored university meetup location (e.g., `"Innovation Centre Foyer"`).

### Files to Modify
1. **`lib/constants.ts`**:
   Locate `MEETUP_SPOTS` array (around lines 25-35):
   ```typescript
   export const MEETUP_SPOTS = [
     "University Central Library Entrance",
     "Main Campus Canteen (GF)",
     "Campus Main Gate Security Booth",
     "Admin Block Steps (East Wing)",
     "Innovation Centre Foyer", // <-- Add new meetup spot here
   ] as const;
   ```

### Verification
- Place an order and advance to checkout / meetup scheduling.
- Observe the new location appears in the meetup spot dropdown list.

---

## 5. How to Change or Add Allowed Email Domains

### Objective
Extend institutional registration to allow faculty or allied campuses (e.g., adding `@faculty.msruas.ac.in` or changing primary domain).

### Files to Modify
1. **`.env.local`** and **`.env.local.example`**:
   ```env
   ALLOWED_EMAIL_DOMAIN="msruas.ac.in"
   ```
2. **`lib/auth/emailValidator.ts`**:
   Update `isValidUniversityEmail()` regex logic:
   ```typescript
   const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || "msruas.ac.in";
   // Regex ensures exact domain or subdomain match:
   const regex = new RegExp(`^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\\.)?${ALLOWED_DOMAIN.replace(".", "\\.")}$`, "i");
   ```
3. **`lib/mail.ts`**:
   Verify second safeguard matches the updated environment variable.

### Verification
- Run email validator unit tests: `npm run test:unit`
- Test with valid subdomain `student@ece.msruas.ac.in` (Accepted).
- Test with spoofed lookalike `student@msruas.ac.in.scam.org` (Rejected).

---

## 6. How to Add a New Order Status

### Objective
Add an intermediate order state (e.g., `"item_inspected"`) between meetup scheduled and completed.

### Files to Modify
1. **`types/order.ts`**:
   Update `OrderStatus` union:
   ```typescript
   export type OrderStatus =
     | "created"
     | "confirmed"
     | "meetup_scheduled"
     | "item_inspected" // <-- New status
     | "completed"
     | "cancelled";
   ```
2. **`lib/orders.ts`**:
   Update the allowed transition map:
   ```typescript
   export const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
     created: ["confirmed", "cancelled"],
     confirmed: ["meetup_scheduled", "cancelled"],
     meetup_scheduled: ["item_inspected", "completed", "cancelled"],
     item_inspected: ["completed", "cancelled"], // <-- Allowed paths
     completed: [],
     cancelled: [],
   };
   ```
3. **`components/orders/OrderTimeline.tsx`**:
   Add UI display badge and milestone icon for `"item_inspected"`.

### Verification
- Run order transition unit tests: `npm run test:unit`
- Verify step displays chronologically in order tracking page.

