import { describe, it, expect } from "vitest";
import { UserRole } from "@/types/user";
import { Listing, ListingStatus } from "@/types/listing";
import { validateListingAI } from "@/lib/ai";
import { getProductImageSet } from "@/lib/demoImages";

/**
 * [TEST SUITE]: Role-Based Executive Panels & Governance Workstations
 * Validates the Dean of Student Affairs Executive Console (/admin) and
 * Quality Verifier Workstation (/verifier), verifying strict persona separation,
 * moderation state machines, and AI vision co-pilot integrity.
 */

describe("Role-Based Panels & Persona Separation", () => {
  // Navigation visibility rule helper
  function getVisibleNavFeatures(role: UserRole) {
    return {
      canAccessNoticeBoard: true,
      canAccessDeanConsole: role === "admin",
      canAccessVerifierDesk: role === "admin" || role === "verifier",
      canAccessStudentDashboard: role === "student",
      canToggleBuySell: role === "student",
      canPostItem: role === "student",
      canAccessWishlist: role === "student",
      canAccessStudentOrders: role === "student",
    };
  }

  describe("1. Role Navigation Isolation", () => {
    it("Dean (admin) has access to Dean Console & Verifier Desk, zero student clutter", () => {
      const nav = getVisibleNavFeatures("admin");
      expect(nav.canAccessDeanConsole).toBe(true);
      expect(nav.canAccessVerifierDesk).toBe(true);
      expect(nav.canToggleBuySell).toBe(false);
      expect(nav.canPostItem).toBe(false);
      expect(nav.canAccessWishlist).toBe(false);
      expect(nav.canAccessStudentOrders).toBe(false);
    });

    it("Verifier has access to Verifier Desk only, zero student clutter and zero Dean console access", () => {
      const nav = getVisibleNavFeatures("verifier");
      expect(nav.canAccessDeanConsole).toBe(false);
      expect(nav.canAccessVerifierDesk).toBe(true);
      expect(nav.canToggleBuySell).toBe(false);
      expect(nav.canPostItem).toBe(false);
      expect(nav.canAccessWishlist).toBe(false);
    });

    it("Student has access to full peer-to-peer buy/sell workflow, zero executive access", () => {
      const nav = getVisibleNavFeatures("student");
      expect(nav.canAccessDeanConsole).toBe(false);
      expect(nav.canAccessVerifierDesk).toBe(false);
      expect(nav.canToggleBuySell).toBe(true);
      expect(nav.canPostItem).toBe(true);
      expect(nav.canAccessWishlist).toBe(true);
      expect(nav.canAccessStudentOrders).toBe(true);
    });
  });

  describe("2. Dean Executive Governance Actions", () => {
    // Simulated suspension state machine
    function toggleUserSuspension(status: "active" | "suspended"): "active" | "suspended" {
      return status === "active" ? "suspended" : "active";
    }

    // Simulated verifier role toggle
    function toggleVerifierStaff(role: UserRole): UserRole {
      return role === "verifier" ? "student" : "verifier";
    }

    // Simulated audit log creator
    function createAuditRecord(action: string, targetId: string, performedBy: string, reason?: string) {
      return {
        action,
        targetId,
        performedBy,
        reason: reason || "Standard administrative governance procedure.",
        timestamp: new Date().toISOString(),
      };
    }

    it("suspends and reinstates student credentials correctly", () => {
      expect(toggleUserSuspension("active")).toBe("suspended");
      expect(toggleUserSuspension("suspended")).toBe("active");
    });

    it("promotes student to verifier and revokes staff privileges correctly", () => {
      expect(toggleVerifierStaff("student")).toBe("verifier");
      expect(toggleVerifierStaff("verifier")).toBe("student");
    });

    it("formats immutable audit ledger records accurately", () => {
      const record = createAuditRecord("USER_SUSPENDED", "usr_fraud_99", "admin_dean_01", "Repeated counterfeit textbook listings");
      expect(record.action).toBe("USER_SUSPENDED");
      expect(record.targetId).toBe("usr_fraud_99");
      expect(record.performedBy).toBe("admin_dean_01");
      expect(record.reason).toContain("counterfeit");
      expect(record.timestamp).toBeDefined();
    });
  });

  describe("3. Quality Verifier Workstation Decision State Machine", () => {
    // Verifier decision handler
    function processVerificationDecision(
      currentStatus: ListingStatus,
      decision: "available" | "needs_changes" | "rejected",
      note: string
    ): { nextStatus: ListingStatus; note: string; notificationType: string } {
      if (currentStatus !== "pending" && currentStatus !== "needs_changes") {
        throw new Error(`Cannot transition from status: ${currentStatus}`);
      }

      return {
        nextStatus: decision,
        note: note.trim() || (decision === "available" ? "Approved by verifier" : "Decision logged"),
        notificationType: "verification",
      };
    }

    it("approves pending listing and advances it to available", () => {
      const result = processVerificationDecision("pending", "available", "Genuine syllabus textbook approved.");
      expect(result.nextStatus).toBe("available");
      expect(result.note).toBe("Genuine syllabus textbook approved.");
    });

    it("returns listing for changes with student feedback", () => {
      const result = processVerificationDecision("pending", "needs_changes", "Please upload clear image of calculator model stamp.");
      expect(result.nextStatus).toBe("needs_changes");
      expect(result.note).toContain("calculator model stamp");
    });

    it("rejects non-academic or prohibited listing", () => {
      const result = processVerificationDecision("pending", "rejected", "Item violates RUAS campus gear policy.");
      expect(result.nextStatus).toBe("rejected");
    });

    it("allows re-evaluating listing previously marked as needs_changes", () => {
      const result = processVerificationDecision("needs_changes", "available", "Resubmitted photo verified.");
      expect(result.nextStatus).toBe("available");
    });
  });

  describe("4. Verifier Co-Pilot AI & Preset Remarks", () => {
    it("evaluates genuine syllabus listings and approves fair pricing", () => {
      const evaluation = validateListingAI({
        title: "Higher Engineering Mathematics B.S. Grewal 44th Edition",
        description: "Official RUAS M-1 textbook in good condition with clear pages and clean spine.",
        category: "Textbooks & Notes",
        condition: "good",
        price: 450,
        imageCount: 3,
      });

      expect(evaluation.overallPassed).toBe(true);
      expect(evaluation.safetyCheck.status).toBe("CLEARED");
      expect(evaluation.priceEval.rating).toBe("FAIR_PRICE");
      expect(evaluation.priceEval.ratingLabel).toContain("Fair");
    });

    it("flags non-academic prohibited items accurately", () => {
      const evaluation = validateListingAI({
        title: "Disposable Vape and Alcohol Flask",
        description: "Hostel relaxation device, lightly used.",
        category: "Miscellaneous",
        condition: "fair",
        price: 800,
        imageCount: 1,
      });

      expect(evaluation.overallPassed).toBe(false);
      expect(evaluation.safetyCheck.isProhibited).toBe(true);
      expect(["FLAGGED_REVIEW", "REJECTED"]).toContain(evaluation.safetyCheck.status);
      expect(evaluation.verifierAdvice.recommendedAction).toBe("REJECT");
    });

    it("resolves multi-angle proof photographs for item inspection", () => {
      const asset = getProductImageSet("Casio fx-991EX ClassWiz Calculator");
      expect(asset.images.length).toBeGreaterThanOrEqual(3);
      expect(asset.images[0].viewName).toBeDefined();
      expect(asset.thumbnail).toContain("/images/products/");
    });

    it("filters AI-cleared candidates for Verifier batch approval", () => {
      const mockListings: Partial<Listing>[] = [
        {
          id: "item_safe_1",
          title: "Engineering Mathematics B.S. Grewal",
          description: "Clean edition for RUAS semester 1 engineering students.",
          category: "Textbooks & Notes",
          condition: "good",
          price: 400,
          status: "pending",
        },
        {
          id: "item_safe_2",
          title: "Casio fx-991EX Scientific Calculator",
          description: "Original Casio calculator with hard cover for RUAS lab exams.",
          category: "Electronics & Calculators",
          condition: "like_new",
          price: 850,
          status: "pending",
        },
        {
          id: "item_flagged_3",
          title: "Alcohol Flask & Hookah Pipe",
          description: "Hostel party item.",
          category: "Miscellaneous",
          condition: "good",
          price: 500,
          status: "pending",
        },
      ];

      const batchCleared = mockListings.filter((l) => {
        const evalResult = validateListingAI({
          title: l.title!,
          description: l.description!,
          category: l.category as any,
          condition: l.condition as any,
          price: l.price!,
          imageCount: 3,
        });
        return evalResult.overallPassed && evalResult.safetyCheck.status === "CLEARED";
      });

      expect(batchCleared.length).toBe(2);
      expect(batchCleared.map((i) => i.id)).toEqual(["item_safe_1", "item_safe_2"]);
    });
  });
});
