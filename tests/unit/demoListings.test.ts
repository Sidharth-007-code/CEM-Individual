import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { DEMO_LISTINGS, isDemoListing, prioritizeRealListings } from "@/lib/demoListings";
import { Listing } from "@/types/listing";

describe("local Browse demo listings", () => {
  it("provides ten unique, read-only demo items with local product images", () => {
    expect(DEMO_LISTINGS).toHaveLength(10);
    expect(new Set(DEMO_LISTINGS.map((listing) => listing.id)).size).toBe(DEMO_LISTINGS.length);

    for (const listing of DEMO_LISTINGS) {
      expect(listing.id).toMatch(/^demo-listing-/);
      expect(isDemoListing(listing)).toBe(true);
      expect(listing.title.trim().length).toBeGreaterThan(5);
      expect(listing.description.trim().length).toBeGreaterThan(30);
      expect(listing.price).toBeGreaterThan(0);
      expect(listing.status).toBe("available");
      expect(listing.thumbnail).toMatch(/^\/images\/products\//);
      expect(existsSync(path.join(process.cwd(), "public", listing.thumbnail!.slice(1)))).toBe(true);
    }

    const titleText = DEMO_LISTINGS.map((listing) => listing.title.toLowerCase()).join(" ");
    for (const keyword of ["engineering", "calculator", "lab coat", "drafter", "drawing instrument", "headphones", "laptop", "bicycle"]) {
      expect(titleText).toContain(keyword);
    }
  });

  it("keeps actual listings before demos without changing each group's order", () => {
    const realFirst = { ...DEMO_LISTINGS[0], id: "firestore-first", isDemo: false } as Listing;
    const realSecond = { ...DEMO_LISTINGS[1], id: "firestore-second", isDemo: false } as Listing;
    const mixed = [DEMO_LISTINGS[2], realFirst, DEMO_LISTINGS[3], realSecond];

    expect(prioritizeRealListings(mixed).map((listing) => listing.id)).toEqual([
      "firestore-first",
      "firestore-second",
      DEMO_LISTINGS[2].id,
      DEMO_LISTINGS[3].id,
    ]);
  });

  it("keeps demos available to shared category and text filters", () => {
    const listings = [...DEMO_LISTINGS];
    const calculator = listings.filter((listing) => listing.category === "Electronics & Calculators");
    const bicycles = listings.filter((listing) => listing.title.toLowerCase().includes("bicycle"));

    expect(calculator.some((listing) => listing.id === "demo-listing-scientific-calculator")).toBe(true);
    expect(bicycles).toHaveLength(1);
    expect(bicycles[0].isDemo).toBe(true);
  });
});
