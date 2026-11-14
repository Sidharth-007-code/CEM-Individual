import { describe, it, expect } from "vitest";
import { analyzeProductImageAI } from "@/lib/ai/vision";
import { validateListingAI } from "@/lib/ai/validator";
import { runAutomatedListingCheck } from "@/lib/listingCheck";

describe("AI Vision & Genuineness Analysis Engine", () => {
  it("verifies genuine student photo with matching calculator title and estimates fair price", () => {
    const analysis = analyzeProductImageAI(
      {
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_casio_fx991ex_calculator_view1",
        name: "casio_fx991ex_photo.jpg",
        sizeKb: 65,
        width: 800,
        height: 600,
      },
      {
        title: "Casio fx-991EX ClassWiz Scientific Calculator",
        category: "Electronics & Calculators",
        condition: "good",
      }
    );

    expect(analysis.isGenuine).toBe(true);
    expect(analysis.authenticityScore).toBeGreaterThanOrEqual(70);
    expect(analysis.authenticityVerdict).toBe("GENUINE_STUDENT_PHOTO");
    expect(analysis.isMatch).toBe(true);
    expect(analysis.matchStatus).toBe("VERIFIED_MATCH");
    expect(analysis.detectedVisualItem).toContain("Calculator");
    expect(analysis.priceEstimate.suggestedPrice).toBe(850);
    expect(analysis.priceEstimate.fairMin).toBe(600);
    expect(analysis.priceEstimate.fairMax).toBe(1100);
  });

  it("detects and flags critical product-image mismatch (Textbook photo with Calculator title)", () => {
    const analysis = analyzeProductImageAI(
      {
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_textbook_engineering_mathematics",
        name: "bs_grewal_textbook_cover.jpg",
        sizeKb: 54,
        width: 800,
        height: 600,
      },
      {
        title: "Casio fx-991EX Scientific Calculator",
        category: "Electronics & Calculators",
        condition: "good",
      }
    );

    expect(analysis.isMatch).toBe(false);
    expect(analysis.matchStatus).toBe("CRITICAL_MISMATCH");
    expect(analysis.matchExplanation).toContain("Visual Discrepancy");
    expect(analysis.matchExplanation).toContain("Textbook");
  });

  it("detects and flags stock photo watermark signatures", () => {
    const analysis = analyzeProductImageAI(
      {
        dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_shutterstock_stock_photo_kettle",
        name: "shutterstock_123456789.jpg",
        sizeKb: 45,
        width: 800,
        height: 600,
      },
      {
        title: "Electric Kettle for Hostel",
        category: "Hostel & Room Essentials",
      }
    );

    expect(analysis.isGenuine).toBe(false);
    expect(analysis.authenticityVerdict).toBe("SUSPICIOUS_STOCK_PHOTO");
    expect(analysis.authenticityScore).toBeLessThan(50);
    expect(analysis.riskFlags.some((f) => f.includes("Stock signature detected"))).toBe(true);
  });

  it("flags poor quality or thumbnail images with low resolution", () => {
    const analysis = analyzeProductImageAI(
      {
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
        name: "small_thumbnail.png",
        sizeKb: 4,
        width: 80,
        height: 80,
      },
      {
        title: "Omega Mini Drafter",
        category: "Stationery & Drafting",
      }
    );

    expect(analysis.authenticityVerdict).toBe("POOR_QUALITY_IMAGE");
    expect(analysis.authenticityScore).toBeLessThan(70);
    expect(analysis.riskFlags.some((f) => f.includes("resolution is very low"))).toBe(true);
  });

  it("adjusts price estimates dynamically according to condition (New vs Fair)", () => {
    const newAnalysis = analyzeProductImageAI(
      { name: "casio_fx991ex.jpg", sizeKb: 50 },
      { title: "Casio fx-991EX", condition: "new" }
    );
    const fairAnalysis = analyzeProductImageAI(
      { name: "casio_fx991ex.jpg", sizeKb: 50 },
      { title: "Casio fx-991EX", condition: "fair" }
    );

    expect(newAnalysis.priceEstimate.suggestedPrice).toBeGreaterThan(fairAnalysis.priceEstimate.suggestedPrice);
  });

  it("integrates with runAutomatedListingCheck and flags mismatch in linter reasons", () => {
    const result = runAutomatedListingCheck({
      title: "Hercules Mountain Bicycle",
      description: "21 speed gear bicycle with front suspension for campus commuting.",
      category: "Bicycles & Mobility",
      condition: "good",
      price: 3200,
      imageCount: 3,
      imageSizesKb: [40, 50, 45],
      images: [
        {
          name: "electric_kettle_photo.jpg",
          dataUrl: "data:image/jpeg;base64,/9j/4AAQ_kettle_hostel",
          sizeKb: 45,
          width: 800,
          height: 600,
        },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("AI Vision Alert"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Electric Kettle"))).toBe(true);
  });
});
