# Comprehensive Test Plan & Verification Evidence

**Course**: CSC203B Software Development Fundamentals  
**Project**: Campus Marketplace (Verified Student Buy-and-Sell Platform)  
**Institution**: M.S. Ramaiah University of Applied Sciences (`@msruas.ac.in`)  
**Test Runner**: Vitest v2.1.9 with `@firebase/rules-unit-testing` against Firestore Emulator (Java 21)  

---

## 1. Test Verification Matrix (TC-01 to TC-17)

| Test ID | Scenario | Test Data / Inputs | Expected Result | Actual Result | Status | Automated Test File |
|---|---|---|---|---|---|---|
| **TC-01** | Register with valid `@msruas.ac.in` email and correct OTP | `email: "rahul.cs22@msruas.ac.in"`, valid 6-digit OTP, password meeting complexity requirements | Server accepts domain, creates HMAC record, verifies code with timingSafeEqual, provisions Auth user (`emailVerified: true`), creates `users/{uid}` with role `student`. | **PASS**: Generates 6-digit crypto code, passes timingSafeEqual HMAC verification, provisions Auth record. | **PASSED** | `tests/unit/otpRoutes.test.ts` |
| **TC-02** | Non-college or duplicate email rejected and no email sent | Non-college: `evil@gmail.com`, lookalike: `hacker@msruas.ac.in.evil.com`, duplicate: already registered email | Request rejected with HTTP 400/409, clear user feedback, zero SMTP emails dispatched, zero OTP records created. | **PASS**: Rejects consumer domains and lookalikes (`msruas.ac.in.evil.com`, `evilmsruas.ac.in`). Second safeguard blocks dispatch. | **PASSED** | `tests/unit/emailValidator.test.ts`, `tests/unit/otpRoutes.test.ts` |
| **TC-03** | Invalid login denied | Email with incorrect password, or non-existent email | Authentication fails with friendly error alert ("Invalid university email or password"). No session token granted. | Pending | Pending | None (Manual UI Guard) |
| **TC-04** | Profile setup and dashboard access | Complete profile fields: year (3rd), course (B.Tech CSE), phone ("9876543210"), personal email | Profile successfully written to Firestore `users/{uid}`, user redirected to marketplace dashboard with student role. | Pending | Pending | None (Manual UI Guard) |
| **TC-05** | Listing with >= 3 images enters verification | Category: "Textbooks & Notes", Price: 450, Title: "Engineering Electromagnetics", 3 compressed JPEG images | Client compresses images (<150KB), `lib/listingCheck` evaluates bounds, listing saved with `status: "pending"`, appears in Verifier queue. | **PASS**: Listing check validates bounds (`passed: true`), subcollection `images` receives 3 photos, status set to `pending`. | **PASSED** | `tests/unit/listingCheck.test.ts` |
| **TC-06** | Listing with fewer than 3 images blocked | Title, description, price valid, but only 2 images provided | Form submission disabled or rejected with validation error: "At least 3 clear images are required". Firestore write blocked. | **PASS**: Linter rejects listing (`passed: false`, reason: "minimum 3 required"), client disables submit CTA. | **PASSED** | `tests/unit/listingCheck.test.ts` |
| **TC-07** | Search and category filter | Search keyword: "calculator", category: "Electronics & Calculators" | Returns only items matching keywords in title/description with `status: "available"` belonging to chosen category. Excludes pending/sold. | Pending | Pending | None (Manual UI Test) |
| **TC-08** | Wishlist add/remove persists | Click bookmark icon on listing `lst_01` for student user | Item added to `wishlists/{uid}/items/lst_01`. Toggling removes it. Cross-user writes blocked by security rules. | **PASS**: Alice writing to Alice's wishlist succeeds; Alice writing to Bob's wishlist returns PERMISSION_DENIED. | **PASSED** | `tests/rules.test.ts` |
| **TC-09** | Message visible only to conversation participants | Conversation between Buyer A and Seller B | Buyer A and Seller B can read and send messages. Unauthorized Student C receives Firestore permission-denied error. | **PASS**: Security rules enforce participant check; unauthorized student blocked with PERMISSION_DENIED. | **PASSED** | `tests/rules.test.ts` |
| **TC-10** | Order created and second buyer blocked (Single-Sale) | Buyer 1 initiates checkout for available listing. Buyer 2 attempts concurrent checkout. | Buyer 1 checkout succeeds; listing status transitions to `sold`. Buyer 2 checkout fails with "Listing is no longer available". Rules block duplicate order via `getAfter()`. | **PASS**: Transaction enforces single-sale; rules reject order creation if listing is not marked sold (`getAfter()`). | **PASSED** | `tests/rules.test.ts`, `tests/unit/orderTransitions.test.ts` |
| **TC-11** | Payment success and failure states (Simulated UPI & Cash) | Simulated UPI payment toggled to "Failure", then retried with "Success" | On "Failure", order remains unconfirmed and prompts retry/cancellation. On "Success", order confirmed, tracking entry added. Cash flow selects spot and records cash agreement. | Pending | Pending | None (Manual Component Test) |
| **TC-12** | Invoice matches order data | Order `ord_101` for ₹1,200 textbook | Generated invoice displays exact order ID, buyer/seller names, item title, timestamp, payment method, and ₹1,200 total with printable format. | **PASS**: Invoice layout matches order metadata, formats invoice number `MSRUAS-YYYY-XXXX`, supports browser print-to-PDF. | **PASSED** | `tests/unit/orderTransitions.test.ts` |
| **TC-13** | Tracking and meetup update | Seller selects "Main Campus Canteen" and 4:30 PM | Order status advances to `meetup_scheduled`. Subcollection `tracking` appends new timestamped event. Visible to both parties. | **PASS**: Order state machine validates transition `confirmed -> meetup_scheduled -> completed`. Subcollection appends log. | **PASSED** | `tests/unit/orderTransitions.test.ts` |
| **TC-14** | Return request stored and reviewable | Buyer submits return request with reason "Wrong book edition" | Document written to `returns/`. Seller or admin can approve or reject return. Status updates to `approved`/`rejected`. | Pending | Pending | None (Manual Integration) |
| **TC-15** | Report reaches admin and can be resolved | 3 distinct students report abusive listing `lst_spam` | `reportCount` increments. On 3rd report, listing auto-switches to `status: "hidden"`. Appears in Admin reports dashboard; admin resolves or removes. | Pending | Pending | None (Manual Integration) |
| **TC-16** | Student denied admin-only action | Authenticated student attempts to write to `auditLog` or update another user's role | Firestore rules reject operation with `PERMISSION_DENIED`. UI guards hide admin link and redirect direct visits. | **PASS**: Student reading/writing `auditLog` returns PERMISSION_DENIED. Admin read/write succeeds. Student role escalation fails. | **PASSED** | `tests/rules.test.ts` |
| **TC-17** | Wrong, expired, and repeated OTP requests handled | Attempt with wrong OTP 5 times; request >5 OTPs within 1 hour; request OTP after 10 min | After 5 wrong attempts, OTP is locked. Requesting >5 times/hr triggers rate limit 429. Expired OTP returns clear expiration alert. | **PASS**: Attempt lockout after 5 tries verified. Timing-safe comparison blocks brute-force. Client denied direct access. Per-IP rate limit verified. | **PASSED** | `tests/unit/otpRoutes.test.ts`, `tests/rules.test.ts` |

---

## 2. Automated Test Execution Evidence (Real Console Output)

### Execution of `npm run test:rules`:
```
> campus-marketplace@0.1.0 test:rules
> vitest run tests/rules.test.ts

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 C:/Users/User/Desktop/campus_e_marketplace

 ✓ tests/rules.test.ts (12 tests) 1828ms
   ✓ Firestore Security Rules Tests (CSC203B Verification) > TC-16: student cannot read or write administrative audit data
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-01/FR-03: student cannot create own admin user doc via client SDK
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-03: student cannot escalate privileges or alter own role
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-07: seller cannot self-approve a pending listing; verifier required
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-12/FR-13: buyer/seller cannot edit order price or paymentStatus after creation
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-11: order creation requires price to match listing price
   ✓ Firestore Security Rules Tests (CSC203B Verification) > TC-08: student cannot access or write to another student's wishlist
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-03: suspended user is blocked from marketplace writes
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-08: report count update allows only old + 1; status transitions to hidden only when >= 3
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-10: notification creation restricted to sender's own uid or admin
   ✓ Firestore Security Rules Tests (CSC203B Verification) > TC-09: conversation messages visible only to participants
   ✓ Firestore Security Rules Tests (CSC203B Verification) > FR-01: otpRequests collection is completely inaccessible to client SDK

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Start at  01:02:12
   Duration  3.98s (transform 53ms, setup 0ms, collect 566ms, tests 1.83s, environment 0ms, prepare 292ms)
```

### Execution of `npm run test:unit`:
```
> campus-marketplace@0.1.0 test:unit
> vitest run tests/unit

The CJS build of Vite's Node API is deprecated. See https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.

 RUN  v2.1.9 C:/Users/User/Desktop/campus_e_marketplace

 ✓ tests/unit/academicLock.test.ts (8 tests) 7ms
 ✓ tests/unit/sessionTimeout.test.ts (8 tests) 29ms
 ✓ tests/unit/emailValidator.test.ts (5 tests) 7ms
 ✓ tests/unit/aiRecommender.test.ts (2 tests) 6ms
 ✓ tests/unit/aiSearch.test.ts (4 tests) 9ms
 ✓ tests/unit/aiVision.test.ts (6 tests) 12ms
 ✓ tests/unit/aiValidator.test.ts (5 tests) 13ms
 ✓ tests/unit/listingCheck.test.ts (5 tests) 12ms
 ✓ tests/unit/rolePanels.test.ts (14 tests) 18ms
 ✓ tests/unit/otpRoutes.test.ts (8 tests) 16ms
 ✓ tests/unit/crowd.test.ts (6 tests) 124ms
 ✓ tests/unit/burglar.test.ts (13 tests) 16ms
 ✓ tests/unit/clumsyUser.test.ts (20 tests) 20ms
 ✓ tests/unit/aiEnhancer.test.ts (1 test) 5ms
 ✓ tests/unit/neatFreak.test.ts (13 tests) 60ms
 ✓ tests/unit/judge.test.ts (15 tests) 41ms
 ✓ tests/unit/orderTransitions.test.ts (4 tests) 8ms

 Test Files  17 passed (17)
      Tests  137 passed (137)
   Start at  01:02:22
   Duration  2.92s (transform 1.28s, setup 0ms, collect 7.62s, tests 403ms, environment 5ms, prepare 5.40s)
```

---

## 3. Manual Demonstration Checklist for Examiner & Grading Demo

| Step | Action | Account to Use | Verification Checkpoint |
|---|---|---|---|
| **1** | Open Notice Board | Guest / Any | Notice board displays paper texture, saffron accents, search bar with voice search, and category pills. |
| **2** | Test Domain Security | Registration | Enter `test@gmail.com` &rarr; observe error: "Registration is restricted to official @msruas.ac.in student addresses". Enter `test@msruas.ac.in.evil.com` &rarr; observe instant rejection. |
| **3** | Student Registration | Registration | Enter `new.student@msruas.ac.in`. Click "Request Student OTP". View 6-digit code in server terminal console (`OTP_DEV_ECHO`). Enter code and complete signup. |
| **4** | Sell an Item | `aarav.sharma@msruas.ac.in` | Switch to Sell Mode. Upload 3 photos. Notice client compression to &lt;150KB. Observe live advisory linter feedback card. Submit for verification. |
| **5** | Verifier Quality Desk | `verifier@msruas.ac.in` | Open `/verifier`. See pending items in queue with rule check remarks. Click "Approve Listing". Item immediately becomes `available` on notice board. |
| **6** | Buyer Checkout & Simulated UPI | `priya.patel@msruas.ac.in` | Click "Buy Now". Select "University Central Library Entrance". Open simulated UPI modal. Test "Simulate Failed Payment" (observe clear decline notice); then "Simulate Successful Payment". |
| **7** | Single-Sale Sold Protection | `rohit.kumar@msruas.ac.in` | Open the same listing URL as Student 3. Verify item displays a prominent "SOLD" badge and the checkout button is permanently disabled. |
| **8** | Printable University Invoice | `priya.patel@msruas.ac.in` | Go to `/orders/[id]/invoice`. Click "Print / Save as PDF". View formal clean layout formatted for physical printout. |
| **9** | Real-Time Campus Chat | `priya.patel@msruas.ac.in` | Open `/messages/[id]`. Send a message to the seller agreeing on the meetup time. Open seller account in private window to see real-time update. |
| **10** | Admin Moderation & Audit Log | `admin@msruas.ac.in` | Open `/admin`. Inspect reported listings, resolve flags, toggle user suspension, and inspect the chronological immutable audit trail. |
