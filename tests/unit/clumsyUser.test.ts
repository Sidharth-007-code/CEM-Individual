import { describe, it, expect } from "vitest";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { runAutomatedListingCheck } from "@/lib/listingCheck";
import { enhanceListingAI, parseSearchIntentAI, rankListingsAI } from "@/lib/ai";
import { isValidStatusTransition } from "@/lib/orders";
import { Listing } from "@/types/listing";

/**
 * [PERSONA TEST SUITE]: Clumsy User Archetype
 * Validates system resilience, defensive design, and graceful error tolerance
 * when well-intentioned users make human errors (typos, accidental whitespace,
 * messy phone formats, sloppy drafts, missing fields, or navigation mistakes).
 */
describe("Clumsy User Persona - Resilience & Graceful Error Tolerance", () => {
  // ─── 1. Clumsy Authentication & Email Formatting ──────────────────────────
  describe("1. Clumsy Auth & Email Formatting", () => {
    it("forgives accidental leading and trailing whitespace in email input", () => {
      const clumsyInput = "   aarav.sharma@msruas.ac.in \t \n ";
      const result = validateUniversityEmail(clumsyInput);
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe("aarav.sharma@msruas.ac.in");
    });

    it("forgives clumsy user who types email in all UPPERCASE or mixed case", () => {
      const clumsyInput = "AARAV.SHARMA@MSRUAS.AC.IN";
      const result = validateUniversityEmail(clumsyInput);
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe("aarav.sharma@msruas.ac.in");
    });

    it("forgives mixed casing in student subdomains", () => {
      const clumsyInput = " Priya.P@Student.MSRUAS.ac.in ";
      const result = validateUniversityEmail(clumsyInput);
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe("priya.p@student.msruas.ac.in");
    });

    it("provides helpful, clear error message when clumsy user enters personal consumer email", () => {
      const consumerEmail = "aarav.student@gmail.com";
      const result = validateUniversityEmail(consumerEmail);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("msruas.ac.in");
    });

    it("gracefully catches accidental empty or space-only email submissions", () => {
      expect(validateUniversityEmail("").isValid).toBe(false);
      expect(validateUniversityEmail("     ").isValid).toBe(false);
    });

    it("gracefully catches incomplete email domains when clumsy user submits prematurely", () => {
      expect(validateUniversityEmail("aarav@msruas").isValid).toBe(false);
      expect(validateUniversityEmail("aarav@").isValid).toBe(false);
      expect(validateUniversityEmail("@msruas.ac.in").isValid).toBe(false);
    });
  });

  // ─── 2. Clumsy Profile & Phone Formatting ─────────────────────────────────
  describe("2. Clumsy Profile & Phone Sanitization", () => {
    // Helper replicating profile phone sanitization logic
    function sanitizePhoneNumber(raw: string): { isValid: boolean; sanitized: string; error?: string } {
      const trimmed = raw.trim();
      const rawDigits = trimmed.replace(/\D/g, "");
      if (rawDigits.length === 0) {
        return { isValid: true, sanitized: "" };
      }
      if (rawDigits.length === 10) {
        return { isValid: true, sanitized: `+91 ${rawDigits}` };
      }
      if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
        return { isValid: true, sanitized: `+91 ${rawDigits.slice(2)}` };
      }
      return {
        isValid: false,
        sanitized: trimmed,
        error: "Please enter a valid 10-digit mobile number for call handovers.",
      };
    }

    it("cleanses 10-digit phone entered without country code", () => {
      const result = sanitizePhoneNumber("9876543210");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("+91 9876543210");
    });

    it("cleanses clumsy formatted phone with dashes and spaces", () => {
      const result = sanitizePhoneNumber("98765-43210");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("+91 9876543210");

      const resultWithSpaces = sanitizePhoneNumber("+91 98765 43210");
      expect(resultWithSpaces.isValid).toBe(true);
      expect(resultWithSpaces.sanitized).toBe("+91 9876543210");
    });

    it("cleanses clumsy phone with brackets e.g. (987) 654-3210", () => {
      const result = sanitizePhoneNumber("(987) 654-3210");
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe("+91 9876543210");
    });

    it("blocks incomplete phone number with helpful error message", () => {
      const result = sanitizePhoneNumber("987654"); // Only 6 digits
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("10-digit mobile number");
    });
  });

  // ─── 3. Clumsy Listing Creation (Missing Photos, Accidental Prices) ────────
  describe("3. Clumsy Listing Creation & Input Linter", () => {
    it("catches clumsy user who forgets to upload minimum 3 images", () => {
      const result = runAutomatedListingCheck({
        title: "Casio Calculator",
        description: "Scientific calculator for exams",
        category: "Electronics & Calculators",
        condition: "good",
        price: 500,
        imageCount: 1, // Only 1 image
      });

      expect(result.passed).toBe(false);
      expect(result.reasons.some((r) => r.includes("minimum 3 required"))).toBe(true);
    });

    it("catches clumsy user who accidentally types extra zeros in price (10x category ceiling)", () => {
      const result = runAutomatedListingCheck({
        title: "Engineering Drafter",
        description: "Standard drawing board drafter",
        category: "Stationery & Drafting",
        condition: "good",
        price: 50000, // Clumsy user entered 50,000 instead of 500
        imageCount: 3,
      });

      expect(result.passed).toBe(false);
      expect(result.reasons.some((r) => r.includes("exceeds campus ceiling"))).toBe(true);
    });

    it("catches clumsy user who enters an unrealistically low price below minimum threshold", () => {
      const result = runAutomatedListingCheck({
        title: "Engineering Mechanics Book",
        description: "Textbook in good condition",
        category: "Textbooks & Notes",
        condition: "good",
        price: 5, // Below minimum 50
        imageCount: 3,
      });

      expect(result.passed).toBe(false);
      expect(result.reasons.some((r) => r.includes("unusually low"))).toBe(true);
    });
  });

  // ─── 4. Clumsy User AI Polish (Rescuing Sloppy Drafts) ─────────────────────
  describe("4. AI Copilot Rescuing Clumsy & Incomplete Drafts", () => {
    it("transforms messy, lowercase, typo-filled draft into a crisp campus listing", () => {
      const clumsyDraft = {
        title: "calc",
        notes: "casio 991ex clswiz good for sem 1 works fine solar display intact",
        category: "Stationery & Drafting" as const, // Clumsy user picked wrong category
        condition: "good" as const,
        price: 0, // Clumsy user forgot price
      };

      const enhanced = enhanceListingAI(clumsyDraft);

      // AI expands title into clean proper title
      expect(enhanced.polishedTitle.length).toBeGreaterThan(clumsyDraft.title.length);
      expect(enhanced.polishedTitle).toContain("Casio");

      // AI corrects category from Stationery to Electronics
      expect(enhanced.suggestedCategory).toBe("Electronics & Calculators");

      // AI recommends fair campus price
      expect(enhanced.suggestedPrice).toBeGreaterThan(0);
      expect(enhanced.suggestedPrice).toBeLessThanOrEqual(1200);

      // AI cleans up description with bullet points
      expect(enhanced.polishedDescription).toContain("Condition");
    });
  });

  // ─── 5. Clumsy Search Queries & Fuzzy Intent Matching ─────────────────────
  describe("5. Clumsy Search Queries & Typo Tolerance", () => {
    const catalog: Listing[] = [
      {
        id: "lst_calc",
        sellerId: "u1",
        title: "Casio fx-991EX ClassWiz Scientific Calculator",
        description: "Essential calculator for engineering math and stats.",
        category: "Electronics & Calculators",
        condition: "like_new",
        price: 850,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_drafter",
        sellerId: "u2",
        title: "Omega Engineering Mini Drafter with Sheet Tube",
        description: "Mini drafter for engineering graphics coursework.",
        category: "Stationery & Drafting",
        condition: "good",
        price: 350,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_kettle",
        sellerId: "u3",
        title: "Pigeon 1.5L Electric Water Kettle",
        description: "Hostel electric kettle for hot water and coffee.",
        category: "Hostel & Room Essentials",
        condition: "good",
        price: 400,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
    ];

    it("matches product even when clumsy user mis-spells 'calculator' as 'calclatr'", () => {
      const intent = parseSearchIntentAI("calclatr");
      expect(intent.detectedCategory).toBe("Electronics & Calculators");
      const results = rankListingsAI("calclatr", catalog);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].listing.id).toBe("lst_calc");
    });

    it("matches product when clumsy user mis-spells 'mini draftr' with price constraint", () => {
      const intent = parseSearchIntentAI("mini draftr under 400");
      expect(intent.maxPrice).toBe(400);
      const results = rankListingsAI("mini draftr under 400", catalog);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].listing.id).toBe("lst_drafter");
    });
  });

  // ─── 6. Clumsy Order Operations & State Machine Protection ────────────────
  describe("6. Clumsy Order Transitions & State Machine Protection", () => {
    it("prevents clumsy user from transitioning an order backwards (completed -> pending)", () => {
      // Completed is a terminal state
      expect(isValidStatusTransition("completed", "confirmed")).toBe(false);
      expect(isValidStatusTransition("completed", "created")).toBe(false);
    });

    it("prevents clumsy user from skipping verification steps (created -> completed directly)", () => {
      expect(isValidStatusTransition("created", "completed")).toBe(false);
    });

    it("allows clumsy user to cancel an uncompleted order safely", () => {
      expect(isValidStatusTransition("created", "cancelled")).toBe(true);
      expect(isValidStatusTransition("confirmed", "cancelled")).toBe(true);
      expect(isValidStatusTransition("meetup_scheduled", "cancelled")).toBe(true);
    });

    it("prevents clumsy user from reviving an already cancelled order", () => {
      expect(isValidStatusTransition("cancelled", "created")).toBe(false);
      expect(isValidStatusTransition("cancelled", "confirmed")).toBe(false);
      expect(isValidStatusTransition("cancelled", "completed")).toBe(false);
    });
  });
});
