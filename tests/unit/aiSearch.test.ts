import { describe, it, expect } from "vitest";
import { parseSearchIntentAI, rankListingsAI } from "@/lib/ai";
import { Listing } from "@/types/listing";

const mockListings: Listing[] = [
  {
    id: "lst_1",
    sellerId: "usr_1",
    title: "Casio fx-991EX ClassWiz Scientific Calculator",
    description: "Standard engineering calculator in perfect condition with solar panel.",
    category: "Electronics & Calculators",
    condition: "like_new",
    price: 850,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "lst_2",
    sellerId: "usr_2",
    title: "Higher Engineering Mathematics by B.S. Grewal (44th Ed)",
    description: "Indispensable textbook for 1st and 2nd semester engineering mathematics.",
    category: "Textbooks & Notes",
    condition: "good",
    price: 450,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "lst_3",
    sellerId: "usr_3",
    title: "Omega Engineering Mini Drafter & Drawing Sheet Tube",
    description: "Mini drafter with clamp, scale, and waterproof sheet holder for graphics lab.",
    category: "Stationery & Drafting",
    condition: "good",
    price: 350,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "lst_4",
    sellerId: "usr_4",
    title: "Pigeon 1.5L Stainless Steel Electric Kettle for Hostel",
    description: "Fast-boiling water kettle with auto cut-off for tea, coffee, and noodles in room.",
    category: "Hostel & Room Essentials",
    condition: "like_new",
    price: 400,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
];

describe("AI Semantic Search Engine (parseSearchIntentAI & rankListingsAI)", () => {
  it("parses price budget and category hints from natural language queries", () => {
    const intent = parseSearchIntentAI("scientific calc under 900");
    expect(intent.maxPrice).toBe(900);
    expect(intent.detectedCategory).toBe("Electronics & Calculators");
    expect(intent.cleanedTokens).toContain("calc");
  });

  it("semantically matches synonyms such as 'maths' to 'Higher Engineering Mathematics'", () => {
    const results = rankListingsAI("maths book", mockListings);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].listing.id).toBe("lst_2");
    expect(results[0].listing.title).toContain("B.S. Grewal");
  });

  it("filters and ranks items under specific budget intent", () => {
    const results = rankListingsAI("drawing tools under 400", mockListings);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].listing.id).toBe("lst_3");
    expect(results[0].listing.price).toBeLessThanOrEqual(400);
  });

  it("matches hostel living keywords to kettle", () => {
    const results = rankListingsAI("hostel boiling kettle", mockListings);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].listing.id).toBe("lst_4");
  });
});

