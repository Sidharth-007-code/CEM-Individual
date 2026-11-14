import { ListingCategory, ListingCondition } from "@/types/listing";
import { AIEnhanceDraftInput, AIEnhancedListingOutput } from "./types";
import { ACADEMIC_BENCHMARKS } from "./knowledgeBase";

/**
 * AI Listing Assistant
 * Takes student draft notes and auto-generates a polished, transparent, syllabus-compliant listing description.
 */
export function enhanceListingAI(input: AIEnhanceDraftInput): AIEnhancedListingOutput {
  const rawTitle = (input.title || "").trim();
  const rawNotes = (input.notes || input.rawNotes || "").trim();
  const combined = `${rawTitle} ${rawNotes}`.toLowerCase();

  // 1. Identify benchmark or keywords
  const benchmark = ACADEMIC_BENCHMARKS.find((item) =>
    item.keywords.some((kw) => combined.includes(kw))
  );

  // 2. Polished Title Generation
  let polishedTitle = rawTitle;
  if (benchmark) {
    if (combined.includes("casio") || combined.includes("calculator")) {
      polishedTitle = "Casio fx-991EX ClassWiz Scientific Calculator (Excellent Condition)";
    } else if (combined.includes("grewal") || combined.includes("higher engineering")) {
      polishedTitle = "Higher Engineering Mathematics by B.S. Grewal (Standard Edition)";
    } else if (combined.includes("lab coat") || combined.includes("apron")) {
      polishedTitle = "White Lab Coat with MSRUAS Embroidered Crest";
    } else if (combined.includes("drafter") || combined.includes("drawing tube")) {
      polishedTitle = "Omega Engineering Mini Drafter & Drawing Sheet Tube Set";
    } else if (combined.includes("dsa") || combined.includes("karumanchi")) {
      polishedTitle = "Data Structures & Algorithms Made Easy by Narasimha Karumanchi";
    } else if (combined.includes("kettle")) {
      polishedTitle = "Pigeon 1.5L Stainless Steel Electric Kettle for Hostel Living";
    } else if (combined.includes("cycle") || combined.includes("bicycle")) {
      polishedTitle = "Hercules Roadeo 21-Speed Mountain Bicycle (Campus Commute)";
    }
  } else {
    // Capitalize and format raw title nicely
    polishedTitle = rawTitle
      .split(" ")
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  // 3. Condition details
  let conditionText = "Item has been carefully inspected and is in fully functional condition.";
  if (input.condition === "new") {
    conditionText = "Brand new in original box / packaging. Never used for coursework.";
  } else if (input.condition === "like_new") {
    conditionText = "Hardly used for one semester. Free from scratches or cosmetic tears; like new.";
  } else if (input.condition === "good") {
    conditionText = "Normal semester wear; all pages/buttons/functions working 100% reliably.";
  } else if (input.condition === "fair") {
    conditionText = "Well-used throughout academic semesters with visible cosmetic marks, but fully operational.";
  }

  // 4. Polished Multi-Section Description
  const descriptionSections = [
    `🎓 OVERVIEW:`,
    `${rawTitle || "Academic item"} available for student handover at MSRUAS. ${rawNotes ? `Seller note: "${rawNotes}"` : ""}`,
    ``,
    `🔍 CONDITION & USAGE:`,
    `• Condition: ${input.condition.replace("_", " ").toUpperCase()}`,
    `• ${conditionText}`,
    `• Complete item verified for academic and laboratory coursework.`,
    ``,
    `📍 HANDOVER & PAYMENT:`,
    `• Handover at official campus CCTV meetup spots (Library / Canteen / Main Gate).`,
    `• Cash at meetup or Simulated UPI accepted. Immediate inspection welcome!`,
  ];

  const polishedDescription = descriptionSections.join("\n");

  // 5. Fair Price Suggestion
  let suggestedPrice = input.price || (benchmark ? benchmark.averagePrice : 450);
  if (input.condition === "new") {
    suggestedPrice = Math.round(suggestedPrice * 1.15);
  } else if (input.condition === "fair") {
    suggestedPrice = Math.round(suggestedPrice * 0.8);
  }

  // 6. Category
  const suggestedCategory = benchmark ? benchmark.category : input.category;

  // 7. Academic Tags
  const academicTags = [
    `#${suggestedCategory.replace(/[^a-zA-Z]/g, "")}`,
    "#VerifiedPeer",
    "#MSRUAS_Gear",
    "#CampusHandover",
  ];

  return {
    polishedTitle,
    polishedDescription,
    suggestedPrice,
    suggestedCategory,
    suggestedCondition: input.condition,
    keyFeatures: [
      "100% Academic Syllabus Compatible",
      "Inspected for Physical Usability",
      "Official CCTV Campus Meetup Ready",
    ],
    academicTags,
  };
}
