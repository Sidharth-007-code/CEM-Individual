# Campus Marketplace (Verified Student Buy-and-Sell Platform)

**Course**: CSC203B - Software Development Fundamentals  
**Institution**: M.S. Ramaiah University of Applied Sciences (MSRUAS)  
**Authorized Student Domain**: `@msruas.ac.in`  
**Platform Tier**: Firebase Free Spark Plan (Zero Hosting Cost)  

---

## 1. Project Overview

Campus Marketplace is a production-ready, peer-to-peer student marketplace web application built with **Next.js 14 (App Router, TypeScript, Tailwind CSS)** and **Firebase (Authentication, Cloud Firestore, and Firestore Security Rules)**. It operates fully offline and locally against the **Firebase Emulator Suite** with zero cost, and features institutional email verification over **Gmail SMTP (Nodemailer)**.

### Assessment Marking Rubric Alignment:
- **Implementation (10 Marks)**: End-to-end verified student workflow, client-side image compression, single-sale atomic transaction guarantee, real-time messaging, invoice generation, and moderation.
- **Testing (5 Marks)**: Real automated test evidence with Vitest and `@firebase/rules-unit-testing`, covering RBAC, single-sale rules, domain security, and order transitions.
- **Operations & Maintenance (7 Marks)**: Operational manual (`docs/MAINTENANCE.md`), seeding scripts (`scripts/seed.ts`), role guards, and audit trail.
- **Documentation (3 Marks)**: Architecture diagrams (`docs/ARCHITECTURE.md`), functional status matrix (`docs/STATUS.md`), and report excerpts (`docs/REPORT_EXCERPTS.md`).

---

## 2. Seeded Demonstration Accounts

For grading, examiner walkthroughs, and live evaluation, the database includes pre-configured university accounts:

| Role | Email | Password | Display Name & Description |
|---|---|---|---|
| **Admin** | `admin@msruas.ac.in` | `CampusAdmin@2024` | Dean of Student Affairs &bull; Moderates reports, manages users, inspects audit logs |
| **Verifier** | `verifier@msruas.ac.in` | `CampusVerifier@2024` | Campus Quality Verifier &bull; Approves, rejects, or flags listings in verification queue |
| **Student (Seller)** | `aarav.sharma@msruas.ac.in` | `StudentPass@2024` | Aarav Sharma (CSE 4th Yr) &bull; Has active listings (Calculators, Textbooks) |
| **Student (Buyer)** | `priya.patel@msruas.ac.in` | `StudentPass@2024` | Priya Patel (ECE 3rd Yr) &bull; Browses notice board, purchases items, initiates chats |
| **Student (General)** | `rohit.kumar@msruas.ac.in` | `StudentPass@2024` | Rohit Kumar (Mech 2nd Yr) &bull; Wishlists items, reports violations |

*Tip: On the `/login` page, click any role in the **"Quick Demo Accounts"** card to autofill credentials instantly!*

---

## 3. One-Click Quickstart (Windows PowerShell)

To start the entire application (Emulators + Seed Data + Web App + Browser) with a single command:
```powershell
.\start.ps1
```

---

## 4. Manual Installation & Step-by-Step Execution

### Prerequisites:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Java JRE / JDK**: Required by Firebase Emulator Suite (Java 8+ or 11+)

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Environment Configuration
Copy `.env.local.example` to `.env.local`:
```powershell
Copy-Item .env.local.example .env.local
```
*(By default, `.env.local` is preconfigured for the local Firebase Emulators and local dev echo mode).*

### Step 3: Start Firebase Emulators
In your first terminal window, start the Auth and Firestore emulators:
```powershell
npm run emulators
```
- Auth Emulator: `http://127.0.0.1:9099`
- Firestore Emulator: `http://127.0.0.1:8080`
- Emulator UI Dashboard: `http://127.0.0.1:4000`

### Step 4: Seed Database
In your second terminal window, populate initial demo users, listings, orders, and reports:
```powershell
npm run seed
```

### Step 5: Start Next.js Development Server
```powershell
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 4. How to Configure the Gmail SMTP Sender (Real Email Delivery)

For live evaluation where the examiner tests real email OTP delivery:

1. **Create / Use a Gmail Account**: e.g., `campus.marketplace.bot@gmail.com`.
2. **Enable 2-Step Verification**: Go to Google Account &rarr; Security &rarr; Turn on 2-Step Verification.
3. **Generate an App Password**:
   - Go to Google Account &rarr; Security &rarr; Search "App Passwords".
   - Name it `CampusMarketplace` and generate the 16-character code (e.g., `abcd efgh ijkl mnop`).
4. **Update `.env.local`**:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="465"
   SMTP_USER="campus.marketplace.bot@gmail.com"
   SMTP_PASS="abcdefghijklmnop"
   OTP_DEV_ECHO="false"
   ```
5. Restart `npm run dev`. OTP verification emails will now be delivered live to university inboxes!

*Note: In development with `OTP_DEV_ECHO="true"`, verification codes are printed directly to the Next.js server terminal for instant offline testing.*

---

## 5. Running the Test Suites

### Run All Unit Tests (Email Validator, Listing Check, Order State Transitions):
```powershell
npm run test:unit
```

### Run Firestore Security Rules Tests (Against Firestore Emulator):
Ensure the emulator is running (`npm run emulators`), then run:
```powershell
npm run test:rules
```

---

## 6. Project Architecture & Documentation Index

- **`docs/STATUS.md`**: Complete FR-01 to FR-16 functional requirements status table.
- **`docs/ARCHITECTURE.md`**: System component topology, data flows, and security model.
- **`docs/MAINTENANCE.md`**: Step-by-step examiner live modification manual (adding categories, price ranges, meetup spots, email domains).
- **`docs/TEST_PLAN.md`**: Test cases TC-01 to TC-17 with execution results and manual checklist.
- **`docs/REPORT_EXCERPTS.md`**: Under-30-line code excerpts (createOrder transaction, getAfter security rule, advisory linter) and report screenshot guide.

