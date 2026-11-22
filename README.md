# 🎓 Campus Marketplace

Campus Marketplace is a student-to-student marketplace project for M.S. Ramaiah University of Applied Sciences (MSRUAS). Students can list academic and campus items, review listings, message each other, and manage simulated transactions. The app uses Next.js, Firebase Authentication, Cloud Firestore, and a local Firebase Emulator setup for development.

> This README describes the current repository implementation. It is not a claim of institutional endorsement, production readiness, guaranteed safety, or live payment processing.

## Problem statement

Students may have textbooks, calculators, lab equipment, and other campus items they no longer need, while other students are looking for those items. This project provides a campus-focused listing and exchange workflow with account roles, listing review, buyer-seller messaging, and order tracking.

## Key features

- Registration through a university-domain email verification flow, followed by Firebase Authentication login.
- Student profiles, seller listing creation and management, image uploads, and listing status updates.
- Search and category, price, and condition filtering on the Browse page, plus a wishlist.
- Verifier review of pending listings, with approval, rejection, or change-request outcomes.
- AI-style listing and image analysis as an **advisory check**. The current implementation uses local heuristics and listing/image metadata; it does not prove an item's authenticity.
- Reference price suggestions based on a bundled academic benchmark list. These are suggestions, not guaranteed market valuations.
- Buyer-seller conversations and in-app notifications backed by Firestore.
- Checkout with a simulated UPI result or cash-at-meetup selection. The UPI flow does not transfer money or connect to a real payment gateway.
- Order status and tracking, return requests, and printable invoices.
- Admin moderation for reports, listings, users, and audit entries.
- A session inactivity timeout with a warning period and cross-tab activity synchronization.

## User roles and workflows

| Role | Main workflow |
| --- | --- |
| Student | Register and verify email, maintain a profile, browse listings, save items, message sellers, create/manage listings, and manage orders. Newly submitted listings enter review before publication. |
| Verifier | Review pending listings and approve, reject, or request changes. Verifier and approval information is recorded on the listing. |
| Admin | Access moderation and management views for reports, listings, users, orders, and admin audit entries. |

Registration creates a student profile. Role-based pages and Firestore rules use the role and status stored in **users/{uid}**. Assigning verifier or admin access is a trusted provisioning task; the public registration flow does not grant those roles.

### Listing and order lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> Pending: Student submits listing
    Pending --> Available: Verifier approves
    Pending --> NeedsChanges: Verifier requests changes
    Pending --> Rejected: Verifier rejects
    NeedsChanges --> Pending: Seller resubmits
    Available --> Sold: Order transaction commits
    Sold --> [*]
~~~

The order has its own status and tracking events. Checkout currently supports a simulated UPI flow and a cash-at-meetup choice; neither should be described as online money transfer.

## Technology stack

Versions below are resolved versions from **package-lock.json**, except the Node.js requirement, which comes from **package.json**.

| Area | Technology | Version |
| --- | --- | --- |
| Application framework | Next.js App Router | 14.2.35 |
| UI | React / React DOM | 18.3.1 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS | 3.4.19 |
| Firebase client SDK | Firebase | 10.14.1 |
| Firebase server SDK | Firebase Admin | 12.7.0 |
| Local Firebase tooling | Firebase CLI | 15.36.0 |
| Unit tests | Vitest | 2.1.9 |
| Firestore rules tests | @firebase/rules-unit-testing | 3.0.4 |
| Email transport | Nodemailer | 6.10.1 |
| Icons | Lucide React | 0.460.0 |
| Runtime requirement | Node.js | 20.x (package.json engine) |

## Architecture overview

The Next.js client uses Firebase Authentication and Firestore. During local development, the Firebase client and Admin SDK connect to the Auth and Firestore emulators. Next.js route handlers implement OTP registration and profile updates. The listing analysis, search parsing, and price references are implemented in local TypeScript modules.

~~~mermaid
flowchart LR
    Browser[Next.js App Router UI] --> Auth[Firebase Authentication]
    Browser --> DB[Cloud Firestore]
    Browser --> API[Next.js Route Handlers]
    API --> Admin[Firebase Admin SDK]
    Admin --> Auth
    Admin --> DB
    API --> SMTP[Optional SMTP delivery]
    Browser --> AI[Local listing and search heuristics]
    Auth -. Local development .-> Emulator[Firebase Emulator Suite]
    DB -. Local development .-> Emulator
~~~

### Registration and OTP flow

~~~mermaid
sequenceDiagram
    actor Student
    participant Page as Register page
    participant API as Next.js OTP route handlers
    participant Admin as Firebase Admin SDK
    participant Store as Firestore
    participant Mail as SMTP or local OTP echo

    Student->>Page: Submit university email
    Page->>API: Request one-time code
    API->>Store: Store expiring OTP digest
    API->>Mail: SMTP delivery when configured; development echo can log the code
    Student->>Page: Submit code and registration details
    Page->>API: Verify code
    API->>Admin: Create Auth account
    API->>Store: Create users/{uid} with student role
    API-->>Page: Registration result
~~~

### Listing analysis and price suggestion

The current analyzer is local heuristic code. It evaluates supplied image/file metadata and listing context; it does not inspect pixels with a trained vision model.

~~~mermaid
flowchart LR
    Seller[Listing form] --> Inputs[Image metadata and listing text]
    Inputs --> Checks[Local heuristic checks]
    Checks --> Signals[Risk flags and category/context hints]
    Checks --> Benchmarks[Bundled price benchmarks]
    Signals --> Advice[Advisory result for seller or verifier]
    Benchmarks --> Advice
~~~

### Session inactivity behavior

~~~mermaid
sequenceDiagram
    actor User
    participant App as AuthContext
    participant Tabs as Browser tabs
    participant Store as localStorage

    User->>App: Interact with the application
    App->>Store: Update last-activity timestamp
    Store-->>Tabs: Notify other tabs of activity
    App->>User: Show warning near inactivity timeout
    alt Activity resumes
        User->>App: Interact before timeout
        App->>Store: Refresh activity timestamp
    else Inactivity continues
        App->>App: Sign out after configured timeout
    end
~~~

The app's principal routes are:

| Route | Purpose |
| --- | --- |
| / | Home |
| /browse | Listing search and filters |
| /listings/new and /listings/[id] | Listing creation and details |
| /login, /register, /profile | Authentication and profile management |
| /dashboard | Student, verifier, and admin entry dashboard |
| /messages and /messages/[id] | Conversation list and chat |
| /wishlist | Saved listings |
| /checkout/[id] | Simulated checkout |
| /orders, /orders/[id], /orders/[id]/invoice | Order list, tracking, and printable invoice |
| /verifier, /admin | Verification and administration |
| /privacy, /security, /forbidden | Utility and information pages |

API routes currently exist for OTP request, OTP verification, and profile updates under **app/api/**.

## Prerequisites and installation

- Node.js **20.x**, as specified by the package engine, with npm.
- Git.
- Java JDK 11 or later. Firebase notes that newer Firestore Emulator releases will require Java 21; Java 21 or later is the safest choice. See the [Firebase Emulator Suite setup guide](https://firebase.google.com/docs/emulator-suite/install_and_configure).

Clone the repository using its URL, then install the locked dependency versions:

~~~bash
git clone <repository-url>
cd <repository-directory>
npm ci
~~~

Do not run the seeder as part of routine setup. **npm run seed** uses fixed user UIDs and deterministic Firestore document IDs, so it can conflict with existing emulator users and records. Review **scripts/seed.ts** and the target data before choosing to run it.

## Firebase Emulator setup

The checked-in **firebase.json** configures the Auth Emulator, Firestore Emulator, and Emulator UI. The **.firebaserc** default project is **campus-marketplace-dev**, and the app's example environment points to the same local project ID.

1. Configure **.env.local** as described in [Environment configuration](#environment-configuration).
2. In a terminal at the project root, start Auth and Firestore:

   ~~~bash
   npm run emulators
   ~~~

3. Leave that terminal running. The configured local addresses are:

   | Service | URL |
   | --- | --- |
   | Next.js app (default) | http://localhost:3000 |
   | Firebase Emulator UI | http://127.0.0.1:4000 |
   | Firebase Authentication Emulator | http://127.0.0.1:9099 |
   | Firestore Emulator | http://127.0.0.1:8080 |

The current Firebase configuration does not set up emulator import/export. Do not assume local Auth or Firestore data will persist when the emulators stop.

## Environment configuration

Create **.env.local** from the tracked template. Use the matching command for your shell:

~~~powershell
Copy-Item .env.local.example .env.local
~~~

~~~bash
cp .env.local.example .env.local
~~~

For local development:

- Keep **NEXT_PUBLIC_USE_FIREBASE_EMULATOR** set to **true**. The browser SDK uses the emulator URLs and ports from the template; **lib/firebaseAdmin.ts** also configures the Admin SDK for the local emulators in this mode.
- Set **OTP_DEV_ECHO** to **true** if you want registration OTPs printed in the development server terminal. Without SMTP credentials, this development-only option allows the local OTP flow to continue. Do not enable OTP echo in production.
- Replace the template's **OTP_HMAC_SECRET** placeholder with a private, local development value. Never commit **.env.local**.
- SMTP settings are optional for emulator-only development when OTP echo is enabled. For real email delivery, configure SMTP credentials privately in **.env.local** or the deployment platform's secret store.
- Local emulator mode does not require a Firebase service-account key for the Admin SDK. Real Firebase mode requires valid server credentials or an appropriately configured application identity.

The template contains these configuration groups; values are deliberately not repeated here:

| Purpose | Variables |
| --- | --- |
| Firebase browser configuration | NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID |
| Emulator connection | NEXT_PUBLIC_USE_FIREBASE_EMULATOR, NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL, NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST, NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT |
| OTP and allowed registration domain | ALLOWED_EMAIL_DOMAIN, OTP_HMAC_SECRET, OTP_DEV_ECHO |
| Optional SMTP delivery | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM_NAME |
| Firebase Admin SDK outside emulator mode | FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY |

Variables prefixed with **NEXT_PUBLIC_** are bundled for browser use and must not contain private credentials. Keep SMTP and Firebase Admin secrets server-side.

## Running the application

Start the emulators in one terminal as described above. In a second terminal, from the project root, run:

~~~bash
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000). If port 3000 is already in use, Next.js may select another port and print the resulting URL in the terminal.

To create a local student account, use the registration page with an allowed university email address. With **OTP_DEV_ECHO=true**, read the development OTP from the Next.js terminal. Registration initializes the profile with the student role.

## Testing and verification

Available checks are defined in **package.json**:

| Command | Purpose |
| --- | --- |
| npx tsc --noEmit | TypeScript check |
| npm run test:unit | Vitest tests under tests/unit/ |
| npm test | Full Vitest suite, including the Firestore rules suite |
| npm run test:rules | Firestore rules tests; requires a Firestore Emulator at the configured test host |
| npm run lint | Next.js ESLint command |
| npm run build | Next.js production build |

The rules test suite uses the **campus-marketplace-test** project ID and clears that test project's Firestore data between cases. Keep it isolated from data you need to preserve.

### Recorded verification

- TypeScript check: passed.
- Unit tests: **17 test files passed; 137 tests passed**.
- Production build: completed successfully. Next.js reported **three existing &lt;img&gt; optimization warnings**; these are warnings, not a zero-warning build.

These checks do not certify the live deployment or every end-to-end workflow. **TEST_RESULTS.md**, dated November 17, 2026, records prior manual QA findings, including deployed checkout and report-submission permission failures. Re-test those flows against the intended Firebase project before relying on them in a deployment.

## Project structure

~~~text
app/
  admin/                 Admin console
  api/
    auth/                OTP request and verification route handlers
    profile/update/      Profile update route handler
  browse/                Search and browse page
  checkout/[id]/         Simulated checkout
  dashboard/             Role-specific dashboard
  listings/              Listing creation and detail routes
  login/                 Login page
  register/              Registration page
  messages/              Conversation list and chat
  orders/                Orders, tracking, and invoice routes
  privacy/               Privacy information
  profile/               Profile management
  security/              Security information
  verifier/              Listing review workflow
  forbidden/             Access-denied page
  wishlist/              Saved listings
components/               Layout, workflow, and reusable UI components
context/AuthContext.tsx   Authentication, profile, role, and session state
lib/                      Firebase clients, workflows, and AI-style utilities
public/                   Static assets, including product images
scripts/                  Seed, SMTP, and rules deployment scripts
tests/unit/               Unit and scenario tests
tests/rules.test.ts       Firestore security-rules tests
firestore.rules           Firestore access rules
firestore.indexes.json    Firestore index configuration
firebase.json             Emulator and Firestore configuration
.firebaserc               Firebase CLI default project alias
~~~

## Security and deployment notes

- Firestore Security Rules enforce authentication, role, ownership, and workflow constraints. Client-side route guards are a UI layer and do not replace Firestore rules.
- OTP registration is implemented in Next.js route handlers. OTP requests are rate-limited, expire, and are stored as HMAC digests. In development echo mode, the plaintext OTP is printed to the local server terminal.
- AI-style image checks cannot verify an item's real-world authenticity. Price references are advisory only.
- UPI checkout is a simulator; it does not move money. Meetup and cash selections are recorded as application workflow data.
- The checked-in **.firebaserc** points Firebase CLI commands at the development alias. The **npm run deploy:rules** script uses credentials and a project ID from **.env.local** (with a script-level fallback), rather than the emulator configuration. Review both target and credentials before using it; the command can publish rules to a real Firebase project.
- Campus meetup locations shown in the application do not confirm CCTV coverage, institutional supervision, or a security certification; the repository does not verify those arrangements.
- The project is licensed under the [MIT License](LICENSE).

## Credits and license

Built as an individual SDF project using the open-source libraries listed in the technology stack. Product, policy, and institutional references should be independently verified before external use. The project is licensed under the [MIT License](LICENSE).
