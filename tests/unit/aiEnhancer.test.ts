import { describe, it, expect } from "vitest";
import { enhanceListingAI } from "@/lib/ai";

describe("AI Listing Assistant (enhanceListingAI)", () => {
  it("polishes a rough student draft into a structured description with handover terms", () => {
    const enhanced = enhanceListingAI({
      title: "casio 991 calc",
      notes: "used 1 year for cse exams",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 800,
    });

    expect(enhanced.polishedTitle).toContain("Casio fx-991EX ClassWiz");
    expect(enhanced.polishedDescription).toContain("OVERVIEW:");
    expect(enhanced.polishedDescription).toContain("CONDITION & USAGE:");
    expect(enhanced.polishedDescription).toContain("HANDOVER & PAYMENT:");
    expect(enhanced.academicTags).toContain("#VerifiedPeer");
    expect(enhanced.suggestedPrice).toBeGreaterThan(0);
  });
});

