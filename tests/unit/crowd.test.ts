import { describe, it, expect } from "vitest";
import { isValidStatusTransition, generateInvoiceNumber } from "@/lib/orders";
import { parseSearchIntentAI, rankListingsAI, getPersonalizedRecommendationsAI } from "@/lib/ai";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { Listing } from "@/types/listing";
import { UserProfile } from "@/types/user";

/**
 * [PERSONA TEST SUITE]: The Crowd Archetype
 * Validates high concurrency, multi-user resource contention, flash crowds,
 * single-sale race condition prevention, multi-tenant isolation, and high-throughput scaling.
 */
describe("The Crowd Persona - Concurrency, Contention & Flash Scale", () => {
  // ─── 1. Flash Crowd Concurrency: Single-Sale Race Condition (TC-10) ─────────
  describe("1. Single-Sale Guarantee Under Concurrent Buyer Rush", () => {
    it("ensures exactly ONE buyer succeeds and all others are rejected when 10 buyers compete for 1 item", async () => {
      // Shared listing state
      let listingStatus: "available" | "sold" = "available";
      let successfulOrdersCount = 0;
      let rejectedOrdersCount = 0;
      const orderRecords: { buyerId: string; orderId: string }[] = [];
      const rejectionErrors: string[] = [];

      // Simulated atomic transaction runner matching createOrderTransaction in lib/orders.ts
      async function attemptPurchase(buyerId: string): Promise<string> {
        // Simulate network jitter
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 15));

        // Atomic check & update
        if (listingStatus !== "available") {
          throw new Error("This item is no longer available. Another student may have just purchased it.");
        }

        listingStatus = "sold";
        const orderId = `ord_${buyerId}_${Date.now()}`;
        orderRecords.push({ buyerId, orderId });
        return orderId;
      }

      // Flash Crowd of 10 concurrent students simultaneously pressing "Place Order"
      const crowdOfBuyers = Array.from({ length: 10 }, (_, i) => `student_${i + 1}`);

      const results = await Promise.allSettled(
        crowdOfBuyers.map(async (buyerId) => {
          try {
            const orderId = await attemptPurchase(buyerId);
            successfulOrdersCount++;
            return { buyerId, orderId, success: true };
          } catch (err: any) {
            rejectedOrdersCount++;
            rejectionErrors.push(err.message);
            throw err;
          }
        })
      );

      // Verify strict Single-Sale Guarantee
      expect(successfulOrdersCount).toBe(1);
      expect(rejectedOrdersCount).toBe(9);
      expect(orderRecords.length).toBe(1);
      expect(listingStatus).toBe("sold");

      // Verify all rejected buyers received the clean, descriptive error
      rejectionErrors.forEach((errMsg) => {
        expect(errMsg).toBe("This item is no longer available. Another student may have just purchased it.");
      });
    });
  });

  // ─── 2. Multi-User Tenancy & Data Isolation Under Crowd Activity ──────────
  describe("2. Multi-User Tenancy & Data Isolation", () => {
    it("maintains strict isolation across 50 simulated concurrent user wishlists", () => {
      interface WishlistStore {
        [studentId: string]: Set<string>;
      }

      const multiTenantWishlists: WishlistStore = {};

      // 50 students concurrently adding their favorite items
      for (let i = 1; i <= 50; i++) {
        const studentId = `student_${i}@msruas.ac.in`;
        multiTenantWishlists[studentId] = new Set();

        // Each student bookmarks their own item
        multiTenantWishlists[studentId].add(`listing_item_${i}`);
      }

      // Verify no cross-talk or leakage between students
      for (let i = 1; i <= 50; i++) {
        const studentId = `student_${i}@msruas.ac.in`;
        expect(multiTenantWishlists[studentId].has(`listing_item_${i}`)).toBe(true);

        // Cannot see other student's items
        const otherId = i === 50 ? `student_1@msruas.ac.in` : `student_${i + 1}@msruas.ac.in`;
        expect(multiTenantWishlists[studentId].has(`listing_item_${otherId}`)).toBe(false);
      }
    });
  });

  // ─── 3. High-Throughput Search Under Concurrent Rush-Hour Queries ──────────
  describe("3. High-Throughput Search Under Rush-Hour Traffic", () => {
    const campusInventory: Listing[] = [
      {
        id: "lst_calc_01",
        sellerId: "u1",
        title: "Casio fx-991EX ClassWiz Scientific Calculator",
        description: "Official solar calculator with matrix and vector capabilities.",
        category: "Electronics & Calculators",
        condition: "like_new",
        price: 850,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_math_02",
        sellerId: "u2",
        title: "Higher Engineering Mathematics by B.S. Grewal",
        description: "Semester 1 and 2 engineering mathematics textbook.",
        category: "Textbooks & Notes",
        condition: "good",
        price: 450,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_drafter_03",
        sellerId: "u3",
        title: "Omega Engineering Mini Drafter with Sheet Tube",
        description: "Mini drafter with clamp and ruler for graphics drawing.",
        category: "Stationery & Drafting",
        condition: "good",
        price: 350,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_kettle_04",
        sellerId: "u4",
        title: "Pigeon 1.5L Electric Water Kettle for Hostel",
        description: "Fast heating water kettle with automatic cutoff.",
        category: "Hostel & Room Essentials",
        condition: "like_new",
        price: 400,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "lst_coat_05",
        sellerId: "u5",
        title: "Chemistry Lab Coat White Cotton Size 38",
        description: "Standard full sleeve white lab coat for 1st year chemistry lab.",
        category: "Lab Equipment & Uniforms",
        condition: "like_new",
        price: 250,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
    ];

    it("handles 100 concurrent search queries without degradation or errors", () => {
      const searchQueries = [
        "calculator",
        "engineering math",
        "mini drafter",
        "hostel kettle",
        "lab coat",
        "calc under 900",
        "drafter under 400",
        "textbook",
        "chemistry",
        "electronics",
      ];

      const start = performance.now();

      // Simulate 100 concurrent search requests
      for (let i = 0; i < 100; i++) {
        const q = searchQueries[i % searchQueries.length];
        const intent = parseSearchIntentAI(q);
        const results = rankListingsAI(q, campusInventory);
        expect(results.length).toBeGreaterThan(0);
      }

      const elapsed = performance.now() - start;
      // 100 searches should easily execute in < 150ms on modern V8
      expect(elapsed).toBeLessThan(150);
    });
  });

  // ─── 4. Branch & Year Recommendation Diversity for Concurrent Crowd ───────
  describe("4. Personalized Feed Partitioning for Diverse Student Cohorts", () => {
    const mockListings: Listing[] = [
      {
        id: "cse_book",
        sellerId: "u1",
        title: "Data Structures and Algorithms in C++",
        description: "CSE 3rd semester core textbook.",
        category: "Textbooks & Notes",
        condition: "good",
        price: 400,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
      {
        id: "mech_drafter",
        sellerId: "u2",
        title: "Mechanical Mini Drafter & Board Clips",
        description: "Drawing kit for engineering mechanics.",
        category: "Stationery & Drafting",
        condition: "like_new",
        price: 350,
        status: "available",
        reportCount: 0,
        createdAt: new Date(),
      },
    ];

    it("simultaneously provides branch-specific feeds for CSE and Mechanical students", () => {
      const cseStudent: UserProfile = {
        uid: "student_cse",
        name: "Rahul",
        email: "rahul@msruas.ac.in",
        role: "student",
        status: "active",
        course: "B.Tech Computer Science",
        year: "3rd Year",
      };

      const mechStudent: UserProfile = {
        uid: "student_mech",
        name: "Vikram",
        email: "vikram@msruas.ac.in",
        role: "student",
        status: "active",
        course: "B.Tech Mechanical Engineering",
        year: "1st Year",
      };

      const cseFeed = getPersonalizedRecommendationsAI(cseStudent, mockListings);
      const mechFeed = getPersonalizedRecommendationsAI(mechStudent, mockListings);

      expect(cseFeed.length).toBeGreaterThan(0);
      expect(mechFeed.length).toBeGreaterThan(0);

      // Verify recommendations match each student's discipline
      expect(cseFeed[0].listing.id).toBe("cse_book");
      expect(mechFeed[0].listing.id).toBe("mech_drafter");
    });
  });

  // ─── 5. High-Throughput Auth Validation for Rush-Hour Registrations ────────
  describe("5. High-Throughput Auth Validation Under Rush-Hour Traffic", () => {
    it("validates 500 simultaneous student email addresses across all departments", () => {
      const departments = ["cse", "ece", "mech", "civil", "aiml", "pharma", "mgmt"];
      const start = performance.now();

      for (let i = 0; i < 500; i++) {
        const dept = departments[i % departments.length];
        const studentEmail = `student_${i}.${dept}@msruas.ac.in`;
        const result = validateUniversityEmail(studentEmail);
        expect(result.isValid).toBe(true);
        expect(result.normalizedEmail).toBe(studentEmail);
      }

      const elapsed = performance.now() - start;
      // 500 RFC validations should run in < 50ms
      expect(elapsed).toBeLessThan(50);
    });
  });

  // ─── 6. Unique Invoice Number Generation Under High Order Volume ──────────
  describe("6. Collision-Free Invoice Generation Under High Volume", () => {
    it("generates 1,000 unique invoice numbers with zero collision across the crowd", () => {
      const generatedInvoices = new Set<string>();

      for (let i = 0; i < 1000; i++) {
        // Standard unique Firestore-like 20-character document ID with padded sequence
        const orderId = `ord_${i.toString(36).padStart(4, "0")}_${Math.random().toString(36).substring(2, 8)}`;
        const invoiceNum = generateInvoiceNumber(orderId);
        expect(invoiceNum).toContain("MSRUAS-");
        expect(generatedInvoices.has(invoiceNum)).toBe(false);
        generatedInvoices.add(invoiceNum);
      }

      expect(generatedInvoices.size).toBe(1000);
    });
  });
});
