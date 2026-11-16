# M.S. Ramaiah University of Applied Sciences (MSRUAS)
# Campus Marketplace — Official User Manual & Operations Guide (v2.0 Enterprise)

**Document Classification:** Official Campus Operations Manual  
**Repository:** [github.com/shreyasadiga82/campus_e_marketplace](https://github.com/shreyasadiga82/campus_e_marketplace)  
**Academic Domain:** `@msruas.ac.in` (Strict Domain Lock)  
**Release Date:** November 2026  

---

## 1. Executive Summary & Platform Purpose
Campus Marketplace is an institutional Peer-to-Peer (P2P) student trading platform and digital notice board built specifically for M.S. Ramaiah University of Applied Sciences. The platform replaces informal, unvetted social media trading groups with an authenticated, verified ecosystem.

### Core Value Pillars:
1. **Institutional Domain Lock:** Access is exclusively restricted to verified `@msruas.ac.in` credentials.
2. **AI Fair-Trade Benchmark:** Gemini 1.5 Flash client-side rules analyze item descriptions and pricing to prevent price gouging.
3. **Student Council Quality Verifier:** Regulated academic gear (calculators, lab coats, hardware kits) requires verification before appearing on the notice board.
4. **CCTV Safe Exchange Zones:** In-person handovers are coordinated strictly at CCTV-monitored university hubs.
5. **Dedicated Role Consoles:** Independent interfaces for Deans (`/admin`), Quality Verifiers (`/verifier`), and Students (`/dashboard`).

---

## 2. Master Credentials & Passwords Directory

> **Important:** Direct 1-click demo login buttons have been permanently removed from the login page to mirror production security. Enter the credentials manually at `/login`.

| Role & Persona | Display Name | University Email | Password | Assigned Panel URL | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator / Dean** | Dean of Student Affairs | `admin@msruas.ac.in` | `CampusAdmin@2024` | `/admin` | University governance, user freeze/unfreeze, report resolution |
| **Quality Verifier** | Verifier Desk (Council) | `verifier@msruas.ac.in` | `CampusVerifier@2024` | `/verifier` | Pre-publication quality inspection & verification queue |
| **Student (Senior Seller)** | Aarav Sharma (4th Yr CSE) | `aarav.sharma@msruas.ac.in` | `StudentPass@2024` | `/dashboard` (Selling) | Managing active inventory, listing items, handover |
| **Student (Junior Buyer)** | Priya Patel (3rd Yr ECE) | `priya.patel@msruas.ac.in` | `StudentPass@2024` | `/dashboard` (Buying) | Browsing notice board, wishlisting, direct chat, checkout |
| **Student (Maker)** | Rohit Kumar (2nd Yr ME) | `rohit.kumar@msruas.ac.in` | `StudentPass@2024` | `/browse`, `/orders` | Peer equipment purchases, sample order demonstration |
| **Suspended Student (Test)** | Suspended Sam | `sam@msruas.ac.in` | `StudentPass@2024` | `/forbidden` | Security boundary test account (read/write blocked) |

*Support / System Email:* `campus.marketplace.ruas@gmail.com`

---

## 3. Seeded Demo Data Inventory

| Item ID | Title & Specifications | Category | Condition | Price | Status |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `lst_calc_01` | Casio fx-991EX ClassWiz Scientific Calculator | Electronics | Like New | ₹950 | Available |
| `lst_book_01` | Higher Engineering Mathematics (B.S. Grewal 44th Ed) | Textbooks | Good | ₹450 | Available |
| `lst_coat_01` | White Lab Coat with MSRUAS Embroidered Crest (Size M) | Lab Gear | Good | ₹320 | Available |
| `lst_cycle_01` | Hercules Roadeo 21-Speed Mountain Bicycle | Mobility | Good | ₹4,200 | Available |
| `lst_micro_01` | Microcontroller 8051 Development Kit with Breadboard | Electronics | Good | ₹1,200 | Available |
| `lst_book_02` | Data Structures & Algorithms Made Easy (Karumanchi) | Textbooks | Like New | ₹380 | Available |
| `lst_kettle_01` | Pigeon 1.5L Stainless Steel Electric Kettle for Hostel | Hostel Gear | Good | ₹480 | Available |
| `lst_draft_01` | Omega Engineering Mini Drafter & Drawing Sheet Tube | Stationery | Good | ₹260 | Available |
| `lst_lamp_01` | LED Desk Study Lamp with 3 Brightness Levels | Hostel Gear | Like New | ₹350 | Available |
| `lst_meter_pending` | Digital Multimeter with Test Probes & Transistor Tester | Lab Gear | Good | ₹400 | Pending (Verifier Queue) |
| `lst_book_sold` | Digital Logic & Computer Design by M. Morris Mano | Textbooks | Good | ₹320 | Sold (Sample Order Demo) |
| `lst_spam_hidden` | Unverified Luxury Smartwatch Replica | Electronics | Fair | ₹2,500 | Hidden (Auto-Hidden 3 Reports) |

### Sample Order Demonstration (`ord_demo_101`):
* **Order ID:** `ord_demo_101`
* **Item:** Digital Logic & Computer Design by M. Morris Mano (`lst_book_sold`)
* **Buyer:** Rohit Kumar (`usr_student_3`) | **Seller:** Priya Patel (`usr_student_2`)
* **Price:** ₹320 (UPI Simulator Confirmed)
* **Handover Point:** Main Campus Canteen (GF) | CCTV Monitored
* **Printable Invoice Voucher:** Accessible at `/orders/ord_demo_101/invoice`

---

## 4. Role-Based User Manual & Step-by-Step Workflows

### 4.1 Student Buyer Workflow
1. **Sign In:** Go to `/login` and sign in using your official email (`priya.patel@msruas.ac.in` / `StudentPass@2024`).
2. **Browse & Filter:** Visit `/browse`. Search keywords or filter by category and condition.
3. **Inspect Listing:** Open `/listings/[id]`. Check multi-angle photos and the AI Fair-Price Benchmark.
4. **Chat with Seller:** Click 'Chat with Seller' to open `/messages/[id]` and coordinate questions.
5. **Checkout:** Select an approved CCTV meetup spot and simulated payment method at `/checkout/[id]`.
6. **Order Tracking & Invoice:** Follow stages in `/orders/[id]`. Print invoice at `/orders/[id]/invoice`.
7. **Dispute Resolution:** In case of discrepancy, click 'Report Issue / Request Return' within 48 hours.

### 4.2 Student Seller Workflow
1. **Activate Selling Mode:** Click 'Selling Mode' on `/dashboard`.
2. **Post Listing:** Click '+ Post New Listing' (`/listings/new`). Upload photos and enter details.
3. **AI Pre-check:** Real-time AI analysis validates price benchmarks and flags non-academic items.
4. **Verifier Queue:** Regulated items enter `/verifier` queue and publish automatically once approved.
5. **Manage & Handover:** Coordinate with buyers in `/messages` and confirm handover at CCTV spot.

### 4.3 Verifier Quality Workstation (`/verifier`)
1. Log in as `verifier@msruas.ac.in` (`CampusVerifier@2024`) and open `/verifier`.
2. Inspect pending submissions (`lst_meter_pending`). Review photos, condition, and AI quality grade.
3. Click 'Approve Listing' to publish live or 'Reject Listing' with a required explanatory reason.

### 4.4 Dean Executive Console (`/admin`)
1. Log in as `admin@msruas.ac.in` (`CampusAdmin@2024`) and open `/admin`.
2. Review university marketplace KPIs (Users, Listings, Orders, Reports).
3. Manage enrolled students: one-click Freeze / Unfreeze user account status.
4. Moderate reported items and review immutable system audit logs.

---

## 5. Security Policies & Technical Safeguards
1. **Academic Domain Lock:** Rejects non-university email domains at API and security rules level.
2. **10-Minute Inactivity Session Timeout:** Automatically logs out idle sessions to protect shared library PCs.
3. **HMAC-SHA256 OTP:** Server-side cryptographic token validation with per-IP rate limiting.
4. **Transactional Sale Locking:** Listings atomically switch to 'sold' upon order creation.
5. **Anti-Spam Threshold:** 3 distinct user reports automatically transition listing to 'hidden'.
6. **Approved CCTV Spots:** Main Canteen (GF), Library Foyer, Peenya Tech Gate, Hostel Security Post.

---

## 6. Support & Contact
For account recovery or dispute mediation:
* **Support Email:** `campus.marketplace.ruas@gmail.com`
* **Department:** Directorate of Student Affairs & Academic Computing, MSRUAS Bengaluru
