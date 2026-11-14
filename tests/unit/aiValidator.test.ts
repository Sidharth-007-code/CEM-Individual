import { describe, it, expect } from "vitest";
import { validateListingAI } from "@/lib/ai";

describe("AI Product Validation Engine (validateListingAI)", () => {
  it("clears a compliant listing with fair price benchmark and high quality score", () => {
    const result = validateListingAI({
      title: "Casio fx-991EX ClassWiz Scientific Calculator",
      description: "Working engineering calculator used for 2 semesters in CSE. Original cover, batteries intact, all functions verified for exams.",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 850,
      imageCount: 3,
    });

    expect(result.overallPassed).toBe(true);
    expect(result.safetyCheck.status).toBe("CLEARED");
    expect(result.safetyCheck.isProhibited).toBe(false);
    expect(result.priceEval.rating).toBe("FAIR_PRICE");
    expect(result.priceEval.estimatedMin).toBeGreaterThan(500);
    expect(result.qualityCheck.qualityScore).toBeGreaterThanOrEqual(75);
    expect(result.verifierAdvice.recommendedAction).toBe("APPROVE");
    expect(result.suggestedTags).toContain("#CasioCalc");
  });

  it("detects prohibited counterfeit replicas or leaked exam content", () => {
    const result = validateListingAI({
      title: "First Copy Luxury Smartwatch Replica with Leaked Midterm Exam Paper",
      description: "Replica smartwatch along with leaked internal exam question paper for mechanical.",
      category: "Miscellaneous",
      condition: "new",
      price: 900,
      imageCount: 3,
    });

    expect(result.overallPassed).toBe(false);
    expect(result.safetyCheck.isProhibited).toBe(true);
    expect(["FLAGGED_REVIEW", "REJECTED"]).toContain(result.safetyCheck.status);
    expect(result.safetyCheck.detectedFlags.length).toBeGreaterThanOrEqual(2);
    expect(result.verifierAdvice.recommendedAction).toBe("REJECT");
  });

  it("identifies great student deals when price is below market benchmark", () => {
    const result = validateListingAI({
      title: "Higher Engineering Mathematics by B.S. Grewal",
      description: "44th edition engineering mathematics for semester 1 and 2. All pages intact, clean book.",
      category: "Textbooks & Notes",
      condition: "good",
      price: 280, // Benchmark fairMin is ~300
      imageCount: 3,
    });

    expect(result.priceEval.rating).toBe("GREAT_DEAL");
    expect(result.priceEval.ratingLabel).toContain("Great Student Bargain");
  });

  it("identifies overpriced items that exceed campus secondhand norms", () => {
    const result = validateListingAI({
      title: "White Lab Coat with MSRUAS Crest",
      description: "Used lab apron for chemistry practicals.",
      category: "Lab Equipment & Uniforms",
      condition: "fair",
      price: 1200, // Benchmark average is ~240
      imageCount: 3,
    });

    expect(result.priceEval.rating).toBe("OVERPRICED");
  });

  it("flags incomplete listings lacking sufficient photos and details", () => {
    const result = validateListingAI({
      title: "Drafter",
      description: "Selling drafter",
      category: "Stationery & Drafting",
      condition: "fair",
      price: 350,
      imageCount: 1, // Short of 3
    });

    expect(result.overallPassed).toBe(false);
    expect(result.qualityCheck.qualityScore).toBeLessThan(60);
    expect(result.verifierAdvice.recommendedAction).toBe("REQUEST_CHANGES");
  });
});
