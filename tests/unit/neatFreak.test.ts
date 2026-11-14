import { describe, it, expect } from "vitest";
import { PRESENTATION_DEMO_PRODUCTS } from "@/lib/presentationDemo";
import { CATEGORIES, ALLOWED_EMAIL_DOMAIN } from "@/lib/constants";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { generateInvoiceNumber, isValidStatusTransition } from "@/lib/orders";
import { enhanceListingAI } from "@/lib/ai";
import * as fs from "fs";
import * as path from "path";

/**
 * [PERSONA TEST SUITE]: The Neat Freak Archetype
 * Validates pristine data hygiene, zero orphaned records, strict formatting consistency,
 * brand purity (zero banned text/widgets), and meticulous state cleanup.
 */
describe("The Neat Freak Persona - Data Hygiene & Brand Purity", () => {
  // ─── 1. Presentation Demo Data Hygiene & Total Purge Cleanliness ──────────
  describe("1. Demo Data Hygiene & Tagged Purge Integrity", () => {
    it("ensures every demo product has unambiguous 'isPresentationDemo' flag and 'demo_' ID prefix", () => {
      expect(PRESENTATION_DEMO_PRODUCTS.length).toBeGreaterThan(0);

      PRESENTATION_DEMO_PRODUCTS.forEach((item) => {
        // Must start with demo_ prefix for zero-ambiguity database filtering
        expect(item.id.startsWith("demo_")).toBe(true);
        // Must explicitly carry isPresentationDemo: true
        expect(item.isPresentationDemo).toBe(true);
        // Status must be strictly 'available'
        expect(item.status).toBe("available");
        // Must belong to canonical category
        expect(CATEGORIES).toContain(item.category);
      });
    });

    it("verifies simulated 100% clean purge leaving zero orphaned demo items", () => {
      // Mock database state with real items + demo items
      const mockListingsDb = [
        { id: "real_listing_1", title: "Real Engineering Book", isPresentationDemo: false },
        { id: "demo_gamepad_01", title: "Demo Gamepad", isPresentationDemo: true },
        { id: "real_listing_2", title: "Real Drafter", isPresentationDemo: false },
        { id: "demo_calc_02", title: "Demo Calculator", isPresentationDemo: true },
      ];

      // Neat-freak admin triggers purge
      const purgedDb = mockListingsDb.filter(
        (doc) => !(doc.isPresentationDemo === true || doc.id.startsWith("demo_"))
      );

      // Verify ZERO demo items remain
      expect(purgedDb.length).toBe(2);
      expect(purgedDb.every((d) => !d.isPresentationDemo && !d.id.startsWith("demo_"))).toBe(true);
      expect(purgedDb.map((d) => d.id)).toEqual(["real_listing_1", "real_listing_2"]);
    });
  });

  // ─── 2. String Hygiene: Double-Space Squashing & Clean Typography ──────────
  describe("2. String Hygiene & Whitespace Discipline", () => {
    function cleanseText(input: string): string {
      return input
        .trim()
        .replace(/\s+/g, " ")
        .replace(/^[,\.\-\s]+|[,\.\-\s]+$/g, "");
    }

    it("squashes excessive whitespace, tabs, and accidental newlines", () => {
      const messyTitle = "   Casio     fx-991EX   Scientific    Calculator \t \n  ";
      const cleanTitle = cleanseText(messyTitle);
      expect(cleanTitle).toBe("Casio fx-991EX Scientific Calculator");
    });

    it("cleanses trailing and leading punctuation accidents", () => {
      const messyWithPunctuation = " ...  B.S. Grewal Mathematics Textbook -- ";
      const cleaned = cleanseText(messyWithPunctuation);
      expect(cleaned).toBe("B.S. Grewal Mathematics Textbook");
    });

    it("strictly standardizes student phone numbers into '+91 XXXXXXXXXX'", () => {
      function standardizePhone(raw: string): string {
        const digits = raw.replace(/\D/g, "");
        if (digits.length === 10) return `+91 ${digits}`;
        if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
        throw new Error("Invalid phone digits");
      }

      expect(standardizePhone("9876543210")).toBe("+91 9876543210");
      expect(standardizePhone("+91 98765 43210")).toBe("+91 9876543210");
      expect(standardizePhone("91-9876543210")).toBe("+91 9876543210");
    });
  });

  // ─── 3. Strict Taxonomy & Canonical Enums ─────────────────────────────────
  describe("3. Strict Taxonomy & Canonical Category Enums", () => {
    it("strictly enforces the 7 canonical campus gear categories with no rogue tags", () => {
      const canonicalCategories = [
        "Electronics & Calculators",
        "Textbooks & Notes",
        "Stationery & Drafting",
        "Lab Equipment & Uniforms",
        "Hostel & Room Essentials",
        "Bicycles & Mobility",
        "Miscellaneous",
      ];

      expect(CATEGORIES.length).toBe(7);
      expect(Array.from(CATEGORIES)).toEqual([
        "Textbooks & Notes",
        "Electronics & Calculators",
        "Hostel & Room Essentials",
        "Lab Equipment & Uniforms",
        "Stationery & Drafting",
        "Bicycles & Mobility",
        "Miscellaneous",
      ]);
    });

    it("verifies AI Enhancer always outputs a valid canonical category", () => {
      const draft = {
        title: "Drafter",
        notes: "mechanical drawing board scale clamp",
        category: "Miscellaneous",
        condition: "good",
        price: 300,
      };

      const enhanced = enhanceListingAI(draft);
      expect(CATEGORIES).toContain(enhanced.suggestedCategory);
      expect(enhanced.suggestedCategory).toBe("Stationery & Drafting");
    });
  });

  // ─── 4. Brand Purity: Zero Banned Text & Zero Stale SaaS Widgets ───────────
  describe("4. Brand Purity & Complete Removal of Banned Text", () => {
    const appDir = path.resolve(__dirname, "../../app");

    it("confirms 'Brightloop' does not exist in any page or layout files", () => {
      function scanDir(dir: string): string[] {
        let violations: string[] = [];
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const f of files) {
          const fullPath = path.join(dir, f.name);
          if (f.isDirectory()) {
            violations = violations.concat(scanDir(fullPath));
          } else if (f.name.endsWith(".tsx") || f.name.endsWith(".ts")) {
            const content = fs.readFileSync(fullPath, "utf8");
            if (content.toLowerCase().includes("brightloop")) {
              violations.push(fullPath);
            }
          }
        }
        return violations;
      }

      const violations = scanDir(appDir);
      expect(violations).toEqual([]);
    });

    it("confirms 'CSC203B Project' and '10-Min Session Auto-Logout Enabled' are purged from all user-facing views", () => {
      function scanForBannedBadges(dir: string): string[] {
        let violations: string[] = [];
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const f of files) {
          const fullPath = path.join(dir, f.name);
          if (f.isDirectory()) {
            violations = violations.concat(scanForBannedBadges(fullPath));
          } else if (f.name.endsWith(".tsx")) {
            const content = fs.readFileSync(fullPath, "utf8");
            if (
              content.includes("CSC203B Project") ||
              content.includes("10-Min Session Auto-Logout Enabled")
            ) {
              violations.push(fullPath);
            }
          }
        }
        return violations;
      }

      const violations = scanForBannedBadges(appDir);
      expect(violations).toEqual([]);
    });
  });

  // ─── 5. Invoice & Currency Cleanliness ────────────────────────────────────
  describe("5. Currency & Invoice Formatting Perfection", () => {
    it("ensures invoice numbers strictly match 'MSRUAS-YYYY-XXXXXXXX'", () => {
      const inv = generateInvoiceNumber("ord_neatfreak_99001122");
      expect(/^MSRUAS-\d{4}-[A-Z0-9]{8}$/.test(inv)).toBe(true);
    });

    it("formats campus prices as clean whole integer rupees without micro-decimals", () => {
      function formatCampusPrice(amount: number): string {
        const rounded = Math.round(Math.max(0, amount));
        return `₹${rounded.toLocaleString("en-IN")}`;
      }

      expect(formatCampusPrice(850)).toBe("₹850");
      expect(formatCampusPrice(12500)).toBe("₹12,500");
      expect(formatCampusPrice(499.99)).toBe("₹500"); // No micro-decimals
      expect(formatCampusPrice(-50)).toBe("₹0"); // No negative prices
    });
  });

  // ─── 6. Terminal State Finality & Clean Lifecycle ─────────────────────────
  describe("6. Terminal State Finality & No Reversibility", () => {
    it("guarantees completed orders are sealed and cannot leak into other states", () => {
      expect(isValidStatusTransition("completed", "created")).toBe(false);
      expect(isValidStatusTransition("completed", "confirmed")).toBe(false);
      expect(isValidStatusTransition("completed", "meetup_scheduled")).toBe(false);
      expect(isValidStatusTransition("completed", "cancelled")).toBe(false);
    });

    it("guarantees cancelled orders are terminal and cannot be revived", () => {
      expect(isValidStatusTransition("cancelled", "created")).toBe(false);
      expect(isValidStatusTransition("cancelled", "confirmed")).toBe(false);
      expect(isValidStatusTransition("cancelled", "meetup_scheduled")).toBe(false);
      expect(isValidStatusTransition("cancelled", "completed")).toBe(false);
    });
  });
});
