import { describe, it, expect } from "vitest";
import { runAutomatedListingCheck } from "@/lib/listingCheck";

describe("runAutomatedListingCheck (Mocked Advisory Linter - TC-05 & TC-06)", () => {
  it("passes compliant listing with >= 3 images and valid price (TC-05)", () => {
    const result = runAutomatedListingCheck({
      title: "Casio fx-991EX Scientific Calculator",
      description: "Standard engineering calculator in perfect condition with solar panel.",
      category: "Electronics & Calculators",
      condition: "like_new",
      price: 950,
      imageCount: 3,
      imageSizesKb: [85, 92, 110],
    });

    expect(result.passed).toBe(true);
    expect(result.reasons.length).toBe(0);
  });

  it("fails when fewer than 3 images are provided (TC-06)", () => {
    const result = runAutomatedListingCheck({
      title: "Data Structures & Algorithms in C++",
      description: "Hardcover textbook for 3rd semester CSE coursework.",
      category: "Textbooks & Notes",
      condition: "good",
      price: 350,
      imageCount: 2, // Less than required 3
    });

    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("minimum 3 required"))).toBe(true);
  });

  it("flags advisory warning when price exceeds category ceiling", () => {
    const result = runAutomatedListingCheck({
      title: "Basic Mechanical Lab Manual",
      description: "Standard spiral-bound workshop laboratory notebook.",
      category: "Lab Equipment & Uniforms",
      condition: "fair",
      price: 15000, // Exceeds 4000 ceiling for Lab Equipment
      imageCount: 3,
    });

    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("exceeds campus ceiling"))).toBe(true);
  });

  it("flags advisory warning when price is below minimum threshold", () => {
    const result = runAutomatedListingCheck({
      title: "Calculus Textbook",
      description: "Clean textbook without annotations, all pages intact.",
      category: "Textbooks & Notes",
      condition: "fair",
      price: 10, // Below min of 50 for textbooks
      imageCount: 3,
    });

    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("unusually low"))).toBe(true);
  });

  it("flags title or description length violations", () => {
    const result = runAutomatedListingCheck({
      title: "Book", // Too short
      description: "Cheap", // Too short
      category: "Textbooks & Notes",
      condition: "good",
      price: 200,
      imageCount: 3,
    });

    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("Title too brief"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Description too brief"))).toBe(true);
  });
});

