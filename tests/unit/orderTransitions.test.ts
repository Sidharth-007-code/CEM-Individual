import { describe, it, expect } from "vitest";
import { isValidStatusTransition, generateInvoiceNumber } from "@/lib/orders";

describe("Order State Machine & Transitions (FR-13)", () => {
  it("allows valid forward lifecycle progression", () => {
    expect(isValidStatusTransition("created", "confirmed")).toBe(true);
    expect(isValidStatusTransition("confirmed", "meetup_scheduled")).toBe(true);
    expect(isValidStatusTransition("meetup_scheduled", "completed")).toBe(true);
  });

  it("allows cancellation from open intermediate states", () => {
    expect(isValidStatusTransition("created", "cancelled")).toBe(true);
    expect(isValidStatusTransition("confirmed", "cancelled")).toBe(true);
    expect(isValidStatusTransition("meetup_scheduled", "cancelled")).toBe(true);
  });

  it("forbids illegal backward or skipping transitions", () => {
    expect(isValidStatusTransition("completed", "created")).toBe(false);
    expect(isValidStatusTransition("completed", "cancelled")).toBe(false);
    expect(isValidStatusTransition("cancelled", "confirmed")).toBe(false);
    expect(isValidStatusTransition("created", "completed")).toBe(false);
  });

  it("generates correctly formatted university invoice numbers (FR-14)", () => {
    const inv = generateInvoiceNumber("ord_abc123456");
    expect(inv).toContain("MSRUAS-");
    expect(inv).toContain(new Date().getFullYear().toString());
  });
});

