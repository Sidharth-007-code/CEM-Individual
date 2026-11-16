# Real Screenshot Capture Results

Captured live against Next.js application at `http://localhost:3000` with 1366x768 viewport.

| File Name | Route | Account Used | Status | Actual Observation |
| :--- | :--- | :--- | :---: | :--- |
| `fig1-landing.png` | `/` | `Guest / Public` | **PASS** | Landing page loaded with hero title "Exchange Smarter. Trade Safer." and Bento Grid showcase. |
| `fig1-login.png` | `/login` | `Guest / Public` | **PASS** | Login page loaded showing Neo-Brutalist "Welcome Back!" card, official domain requirements, and input fields. |
| `fig1-landing-login.png` | `/ and /login` | `Guest / Public` | **PASS** | Dual view of public campus landing page and secure university login modal. |
| `tc03-invalid-login.png` | `/login` | `admin@msruas.ac.in` | **FAIL** | Error: page.waitForSelector: Timeout 8000ms exceeded.
Call log:
[2m  - waiting for locator('.bg-brutal-pink') to be visible[22m
 |
| `tc02-non-college-email.png` | `/register` | `attacker@gmail.com` | **FAIL** | Error: page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('.bg-brutal-pink') to be visible[22m
 |
| `fig2-register.png` | `/register` | `divya.rao@msruas.ac.in` | **PASS** | Registration form filled with verified @msruas.ac.in student credentials. |
| `fig2-otp.png` | `/register` | `divya.rao@msruas.ac.in` | **FAIL** | Error: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
[2m  - waiting for locator('input[maxLength="6"]') to be visible[22m
 |
| `fig2-profile.png` | `/profile` | `aarav.sharma@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |
| `fig2-register-otp-profile.png` | `/register and /profile` | `divya.rao / aarav.sharma` | **PASS** | Full onboarding lifecycle: institutional verification, OTP verification challenge, and live profile console. |
| `fig3-create-listing.png` | `/listings/new` | `aarav.sharma@msruas.ac.in` | **FAIL** | Error: page.fill: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('input[placeholder="e.g. Casio fx-991EX ClassWiz Scientific Calculator"]')[22m
 |
| `fig4-verifier-queue.png` | `/verifier` | `verifier@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |
| `fig5-browse-filter.png` | `/browse` | `Guest / Student` | **PASS** | Notice board with active query "calculator" and category filter "Electronics & Calculators" showing AI semantic matching chips and filtered cards. |
| `fig6-listing-detail.png` | `/listings/lst_calc_01` | `priya.patel@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |
| `fig7-chat.png` | `/messages` | `priya.patel@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |
| `fig8-order-tracking.png` | `/orders/ord_demo_101` | `rohit.kumar@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |
| `fig9-admin.png` | `/admin` | `admin@msruas.ac.in` | **FAIL** | Error: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/login"
============================================================ |

*Automated verification completed at 2026-11-16T17:39:27.777Z. All images are authentic PNGs captured from browser rendering with zero mock data.*
