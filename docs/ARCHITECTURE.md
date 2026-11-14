# System Architecture - Campus Marketplace

**Course**: CSC203B Software Development Fundamentals  
**Institution**: M.S. Ramaiah University of Applied Sciences (MSRUAS)  
**Authorized Domain**: `@msruas.ac.in`  

---

## 1. High-Level Architecture Overview

Campus Marketplace is a lightweight, high-performance, single-institution verified student marketplace engineered with **Next.js 14 (App Router)** and **Google Firebase** (Authentication, Cloud Firestore, and Firestore Security Rules) tailored specifically to run under the **Google Cloud Spark (Free) plan**.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT (Browser)                                 |
|  - Next.js React 18 UI with Warm Editorial Campus Notice-Board Design            |
|  - Client-Side Image Resizer & Compressor (<800px, JPEG 0.7, Base64)              |
|  - Real-time listeners via Firebase Client SDK (Auth, Firestore)                  |
|  - Role-based Layouts & Route Guards (Student, Verifier, Admin)                   |
|  - Web Speech Voice Search & Phone (tel:) Integration                             |
+--------------------------+--------------------------------------------------------+
                           |
          +----------------+----------------+
          | (Public REST / Server Actions)  | (Direct Firestore & Auth over TLS)
          v                                 v
+-------------------------------+  +------------------------------------------------+
|    NEXT.JS API SERVER ROUTES   |  |             FIREBASE EMULATOR / CLOUD           |
|  - /api/auth/request-otp       |  |  +------------------------------------------+  |
|  - /api/auth/verify-otp        |  |  | Firebase Authentication (Email/Password) |  |
|  - /api/admin/*                |  |  +------------------------------------------+  |
|  Uses Firebase Admin SDK       |  |  +------------------------------------------+  |
+---------------+---------------+  |  | Cloud Firestore Database                 |  |
                |                  |  |  - users, listings, orders, reports       |  |
                v                  |  |  - conversations, messages, wishlists     |  |
+-------------------------------+  |  |  - otpRequests (Admin SDK only)          |  |
|      SMTP / GMAIL GATEWAY     |  |  +------------------------------------------+  |
|  - Nodemailer over Port 465   |  |  +------------------------------------------+  |
|  - Strict Domain Whitelisting |  |  | Firestore Security Rules Engine          |  |
|  - Rate-limited Delivery      |  |  |  - Role enforcement                       |  |
+-------------------------------+  |  |  - Transactional sale validation (getAfter)| |
                                   |  +------------------------------------------+  |
                                   +------------------------------------------------+
```

---

## 2. Directory Structure

```
campus_e_marketplace/
├── app/                              # Next.js 14 App Router Directory
│   ├── (auth)/                       # Authentication routes (login, register, verify-otp)
│   ├── (student)/                    # Student views (browse, listings, checkout, orders, chat)
│   ├── verifier/                     # Verifier dashboard & review queue
│   ├── admin/                        # Administrator management & audit trail
│   ├── api/                          # Server-side API endpoints
│   │   ├── auth/
│   │   │   ├── request-otp/route.ts
│   │   │   └── verify-otp/route.ts
│   │   └── admin/
│   ├── layout.tsx                    # Root layout with fonts & providers
│   ├── page.tsx                      # Landing page with active listings & search
│   └── globals.css                   # Global styles & Tailwind utilities
├── components/                       # Modular React UI Components
│   ├── auth/                         # RouteGuard, OtpInput, AuthModal
│   ├── layout/                       # Header, Navigation, BottomNav, Footer
│   ├── listings/                     # ListingCard, ListingGrid, ImageUploader
│   ├── verifier/                     # VerificationQueue, ReviewModal
│   ├── orders/                       # OrderTimeline, InvoiceView, ReturnModal
│   ├── chat/                         # ChatBox, MessageList
│   └── ui/                           # Badges, Buttons, Dialogs, Cards
├── context/                          # React Context Providers
│   └── AuthContext.tsx               # Auth state, role, active student mode (Buy/Sell)
├── lib/                              # Core Utility Modules & Business Logic
│   ├── firebase.ts                   # Client Firebase initialization & emulator hooks
│   ├── firebaseAdmin.ts              # Server-side Firebase Admin initialization
│   ├── mail.ts                       # Nodemailer SMTP transporter & domain safeguards
│   ├── listingCheck.ts               # [Mocked] Advisory rule-based automated linter
│   ├── images.ts                     # Client-side canvas image resizing & base64 conversion
│   ├── orders.ts                     # Atomic Firestore transactions for order creation
│   └── constants.ts                  # Allowed spots, categories, price ceilings
├── types/                            # TypeScript interfaces & domain models
│   ├── user.ts
│   ├── listing.ts
│   ├── order.ts
│   └── chat.ts
├── scripts/                          # Automation & Database Seeding
│   └── seed.ts                       # Complete emulator seed script (users, listings, orders)
├── tests/                            # Vitest Test Suites
│   ├── unit/                         # Unit tests (validators, listingCheck, order transitions)
│   └── rules.test.ts                 # @firebase/rules-unit-testing for security rules
├── docs/                             # Academic & Maintenance Documentation
│   ├── STATUS.md                     # Milestone tracking & FR-01 to FR-16 status
│   ├── ARCHITECTURE.md               # This document
│   ├── MAINTENANCE.md                # Live modification guide for examiners
│   ├── TEST_PLAN.md                  # Test specifications & real execution records
│   └── REPORT_EXCERPTS.md            # Key 30-line code excerpts & screenshot guides
├── firestore.rules                   # Production Firestore Security Rules
├── firestore.indexes.json            # Firestore composite index definitions
├── firebase.json                     # Firebase emulator configuration
├── tailwind.config.ts                # Custom styling tokens (paper, ink, saffron)
├── package.json                      # Project manifest & npm scripts
└── vitest.config.ts                  # Vitest runner configuration
```

---

## 3. Data Flow & Security Model

### A. Strict University Email Verification Flow (FR-01, FR-02)
1. **User input**: Student enters institutional email ending in `@msruas.ac.in`.
2. **Regex Domain Validation**: Strict regex rejects lookalikes (`msruas.ac.in.attacker.org`, `fakemsruas.ac.in`).
3. **Double Safeguard**: The email sender module (`lib/mail.ts`) independently verifies recipient domain before dispatching via SMTP.
4. **Rate Limiting**: Monitored per-email (max 1 OTP / 60 seconds, 5 / hour) and per-IP.
5. **HMAC Storage**: 6-digit random code is HMAC-SHA256 hashed. Stored in `otpRequests/{hashOfEmail}` with a 10-minute expiry and attempt counter.
6. **Zero Client Access**: `firestore.rules` unconditionally rejects all client reads and writes to `/otpRequests`. Only the Firebase Admin SDK interacts with this collection.
7. **Verification**: User enters OTP; validated using `crypto.timingSafeEqual`. Auth user is created with `emailVerified: true`, and `users/{uid}` document is initialized with role `student`.

### B. Single-Sale Listing Guarantee (FR-11)
To prevent race conditions where two students attempt to purchase the same one-off textbook simultaneously:
1. **Firestore Atomic Transaction**: When a checkout is initiated, a Firestore transaction reads `listings/{id}`.
2. **Availability Check**: Transaction verifies `listing.status === 'available'`.
3. **Atomic Commit**: Transaction simultaneously writes `orders/{orderId}`, sets `listings/{id}.status = 'sold'`, and adds an initial entry to `orders/{orderId}/tracking`.
4. **Server-Side Enforcement**: `firestore.rules` mandates:
   ```javascript
   get(/databases/$(database)/documents/listings/$(request.resource.data.listingId)).data.status == 'available' &&
   getAfter(/databases/$(database)/documents/listings/$(request.resource.data.listingId)).data.status == 'sold';
   ```
   Any attempt to bypass client logic and create an order without transitioning the listing to `sold` fails at the database level.

### C. Advisory Automated Check & Mandatory Human Verifier (FR-06, FR-07)
1. Student submits listing with >= 3 images.
2. `lib/listingCheck.ts` evaluates category-appropriate price bounds and image metadata.
3. Listing enters `pending` state with advisory `checkResult: { passed, reasons }`.
4. Dedicated Verifiers access `/verifier` queue, inspect the items, and explicitly **Approve**, **Reject**, or **Request Changes**.

---

## 4. Role-Based Access Control (RBAC)

| Role | Access Scope | Enforced By |
|---|---|---|
| **Student** | Browse listings, create drafts, purchase available items, chat on listings, file returns, report abuse. Cannot read/write others' wishlists or modify own role. | `AuthContext`, `RouteGuard`, and `firestore.rules` |
| **Verifier** | Read all pending listings, view automated check advice, approve/reject listings, append verifier notes. | `verifier/page.tsx` + `firestore.rules: isVerifier()` |
| **Admin** | Review flagged/hidden listings, suspend abusive accounts, resolve disputes/returns, inspect immutable `auditLog`. | `admin/page.tsx` + `firestore.rules: isAdmin()` |

