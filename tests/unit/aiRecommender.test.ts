import { describe, it, expect } from "vitest";
import { getPersonalizedRecommendationsAI, getSimilarListingsAI } from "@/lib/ai";
import { Listing } from "@/types/listing";
import { UserProfile } from "@/types/user";

const mockListings: Listing[] = [
  {
    id: "l_calc",
    sellerId: "usr_seller_1",
    title: "Casio Scientific Calculator fx-991EX",
    description: "Calculator for engineering",
    category: "Electronics & Calculators",
    condition: "like_new",
    price: 850,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "l_math",
    sellerId: "usr_seller_2",
    title: "Higher Engineering Mathematics by B.S. Grewal",
    description: "Semester 1 core book",
    category: "Textbooks & Notes",
    condition: "good",
    price: 450,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "l_drafter",
    sellerId: "usr_seller_3",
    title: "Mini Drafter and Drawing Tube",
    description: "Mechanical engineering drafter",
    category: "Stationery & Drafting",
    condition: "good",
    price: 350,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
  {
    id: "l_kettle",
    sellerId: "usr_seller_4",
    title: "Electric Kettle for Tea & Water",
    description: "Hostel room kettle",
    category: "Hostel & Room Essentials",
    condition: "like_new",
    price: 400,
    status: "available",
    reportCount: 0,
    createdAt: new Date(),
  },
];

describe("AI Recommendation Engine (getPersonalizedRecommendationsAI & getSimilarListingsAI)", () => {
  it("recommends 1st year foundational core books and tools for freshmen", () => {
    const studentProfile: UserProfile = {
      uid: "buyer_1",
      name: "Freshman Student",
      email: "freshman@msruas.ac.in",
      role: "student",
      status: "active",
      course: "B.Tech - Computer Science & Engineering",
      year: "1st Year (Freshman)",
      campus: "Ganga Boys Hostel",
    };

    const recs = getPersonalizedRecommendationsAI(studentProfile, mockListings);
    expect(recs.length).toBeGreaterThan(0);
    const topRec = recs[0];
    expect(
      topRec.listing.title.includes("Grewal") ||
      topRec.listing.title.includes("Calculator") ||
      topRec.listing.title.includes("Drafter")
    ).toBe(true);
  });

  it("identifies similar items in the same academic category and price range", () => {
    const target = mockListings[0]; // Casio calc
    const similar = getSimilarListingsAI(target, mockListings);
    // Does not include target itself
    expect(similar.some((s) => s.listing.id === target.id)).toBe(false);
  });
});

