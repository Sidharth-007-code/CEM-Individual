# Campus Marketplace - Implementation Status

Course: **CSC203B - Software Development Fundamentals**  
Project: **Campus Marketplace (Verified Student Buy-and-Sell Platform)**  
Domain: `@msruas.ac.in`  
Firebase Tier: **Spark Plan (Free)** with Local Emulator Suite  

## Functional Requirements Status Table (FR-01 to FR-16)

| ID | Requirement Name | Category | Status | Primary Implementation Files | Description & Verification Evidence |
|---|---|---|---|---|---|
| **FR-01** | Student Domain Check & OTP Request | Auth | **Implemented** | `app/api/auth/request-otp/route.ts`, `lib/auth/emailValidator.ts`, `lib/mail.ts` | Strict `@msruas.ac.in` and subdomain validation, lookalike rejection, rate limiting (1/60s, 5/hr), HMAC-SHA256 hashed OTP in Firestore `otpRequests/` (Admin-only). Real Gmail SMTP delivery + dev console fallback. Unit & route tests pass. |
| **FR-02** | OTP Verification & Account Provisioning | Auth | **Implemented** | `app/api/auth/verify-otp/route.ts`, `lib/firebaseAdmin.ts` | Timing-safe hash comparison (`crypto.timingSafeEqual`), max 5 attempts lockout, Firebase Auth user creation via Admin SDK with `emailVerified: true`, `users/{uid}` created with role `student`. |
| **FR-03** | User Profile, Session & Role Guard | Auth / Profile | **Implemented** | `context/AuthContext.tsx`, `components/auth/RouteGuard.tsx`, `app/dashboard/page.tsx` | Profile setup (year, course, phone, personalEmail), Buy/Sell mode toggle, role enforcement (`student`, `verifier`, `admin`). 10-minute inactivity auto-logout protection. Suspended accounts blocked at client and database rules levels. |
| **FR-04** | Marketplace Discovery & Search | Discovery | **Implemented** | `app/page.tsx`, `app/browse/page.tsx`, `components/listings/BrowseNoticeBoard.tsx` | Search by keyword across title/description, category pills, condition filter, price sorting, query only `status == 'available'`. Real-time updates. |
| **FR-05** | Category Navigation & Predefined Spots | Discovery | **Implemented** | `lib/constants.ts`, `components/listings/BrowseNoticeBoard.tsx` | 7 standard academic categories and verified CCTV-monitored university meetup spots (Library, Canteen, Main Gate, Admin Block steps). |
| **FR-06** | Listing Creation & Image Compression | Listings | **Implemented** | `app/listings/new/page.tsx`, `lib/images.ts`, `components/listings/ListingForm.tsx` | Client-side canvas image compression (max 800px, JPEG 0.72, <150KB base64), minimum 3 images enforced. Stored in subcollection `listings/{id}/images`. |
| **FR-07** | Automated Check & Verifier Workflow | Verification | **Mocked / Implemented** | `lib/listingCheck.ts`, `app/verifier/page.tsx` | **[Mocked Automated Advisory Check]** Rule-based linter evaluating category price bounds and image completeness. Mandatory human verifier queue for approve / reject / request changes with verifier notes. |
| **FR-08** | Wishlist & Report Listing | Student Features | **Implemented** | `app/wishlist/page.tsx`, `components/listings/ReportModal.tsx` | One-click wishlist persistence in `wishlists/{uid}/items`. Report modal enforcing one report per user per listing; auto-transitions listing to `hidden` when reports reach 3. |
| **FR-09** | Real-time Chat per Listing | Communication | **Implemented** | `app/messages/page.tsx`, `app/messages/[id]/page.tsx` | Real-time messaging subcollection under `conversations/{id}`, accessible only to the 2 participants (buyer and seller) via security rules. |
| **FR-10** | In-App Notifications & Alerts | Communication | **Implemented** | `components/layout/NotificationBell.tsx` | Interactive bell icon with unread badge counter, real-time alerts for verification decisions, orders, and messages. |
| **FR-11** | Transactional Order Creation (Single Sale) | Orders | **Implemented** | `app/checkout/[id]/page.tsx`, `lib/orders.ts`, `firestore.rules` | Firestore atomic transaction ensuring listing is `available`, creates order, marks listing `sold`, writes initial tracking. Enforced via `getAfter()` in rules. Second buyer blocked. |
| **FR-12** | Payment Choice (Cash & Simulated UPI) | Payments | **Mocked / Implemented** | `components/checkout/UpiModal.tsx`, `app/checkout/[id]/page.tsx` | **[Mocked Simulated UPI]** Interactive UPI simulator modal with success/failure testing toggles. Failed payments never confirm order. Cash at Meetup flow. |
| **FR-13** | Order Tracking & Status Lifecycle | Orders | **Implemented** | `app/orders/[id]/page.tsx`, `lib/orders.ts` | State machine progression (`created` -> `confirmed` -> `meetup_scheduled` -> `completed` / `cancelled`), meetup spot scheduling, subcollection tracking events. |
| **FR-14** | Invoice Generation & Print/Download | Orders | **Implemented** | `app/orders/[id]/invoice/page.tsx` | Clean printer-friendly university invoice layout with browser print-to-PDF (`window.print()`), itemized pricing, unique invoice number, and student party details. |
| **FR-15** | Returns Management | Orders / Admin | **Implemented** | `components/orders/ReturnModal.tsx`, `app/orders/[id]/page.tsx` | Buyer return request with reason; stored in `returns/`, reviewable by seller and administration. |
| **FR-16** | Admin Dashboard & Audit Trail | Administration | **Implemented** | `app/admin/page.tsx`, `firestore.rules` | User suspension/activation, verifier role assignment, hidden listings review, immutable `auditLog` recording all administrative actions. |

## Legend
- **Implemented**: Code complete, tested with unit/rules tests, verified with real command output.
- **Mocked / Implemented**: Intentionally simplified demo flow as agreed in project specifications (Simulated UPI gateway, Advisory rule-based listing check). Fully functional as a demonstration.
