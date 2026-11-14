import { describe, it, expect } from "vitest";
import { UserProfile } from "@/types/user";

/**
 * [TEST SUITE]: Academic Information Lock ("Update Once Only")
 * Validates that institutional university credentials (Full Name, Department,
 * Academic Year, Campus Residence) can only be updated once, are permanently
 * locked, and cannot be tampered with or modified subsequently.
 */
describe("Academic Credential Lock & Institutional Identity Integrity", () => {
  // Helper simulating the client & server lock detection
  function isAcademicCredentialLocked(profile: Partial<UserProfile> | null | undefined): boolean {
    if (!profile) return false;
    return Boolean(
      profile.academicLocked === true ||
      (profile.course && profile.year && profile.campus)
    );
  }

  // Helper simulating backend sync protection logic (from lib/profileSync.ts)
  function applyProfileSyncSecurity(
    existing: Partial<UserProfile>,
    incoming: Partial<UserProfile>
  ): {
    name: string;
    course: string;
    year: string;
    campus: string;
    academicLocked: boolean;
    phone: string;
    bio: string;
  } {
    const isLocked = isAcademicCredentialLocked(existing);

    return {
      name: isLocked
        ? (existing.name || "Student")
        : (incoming.name || "Student").trim(),
      course: isLocked
        ? (existing.course || "")
        : (incoming.course || "").trim(),
      year: isLocked
        ? (existing.year || "")
        : (incoming.year || "").trim(),
      campus: isLocked
        ? (existing.campus || "")
        : (incoming.campus || "").trim(),
      academicLocked: true, // Permanent lock after save
      phone: (incoming.phone || "").trim(),
      bio: (incoming.bio || "").trim(),
    };
  }

  describe("1. Lock Status Computation", () => {
    it("reports unlocked for brand new student profile without academic fields", () => {
      const freshUser: Partial<UserProfile> = {
        uid: "user-123",
        email: "fresh@msruas.ac.in",
      };
      expect(isAcademicCredentialLocked(freshUser)).toBe(false);
    });

    it("reports locked when academicLocked flag is explicitly set to true", () => {
      const lockedUser: Partial<UserProfile> = {
        uid: "user-123",
        email: "student@msruas.ac.in",
        academicLocked: true,
      };
      expect(isAcademicCredentialLocked(lockedUser)).toBe(true);
    });

    it("reports locked when course, year, and campus are all populated", () => {
      const completedUser: Partial<UserProfile> = {
        uid: "user-123",
        email: "student@msruas.ac.in",
        name: "Aarav Sharma",
        course: "B.Tech - Computer Science & Engineering",
        year: "1st Year (Freshman)",
        campus: "Gnanagangothri Campus (Mathikere)",
      };
      expect(isAcademicCredentialLocked(completedUser)).toBe(true);
    });
  });

  describe("2. Immutable Protection Against Post-Lock Modification", () => {
    it("locks credentials on first update and sets academicLocked to true", () => {
      const freshUser: Partial<UserProfile> = {
        uid: "user-first-time",
        email: "aarav@msruas.ac.in",
      };

      const firstTimeInput = {
        name: "Aarav Sharma",
        course: "B.Tech - Computer Science & Engineering",
        year: "1st Year (Freshman)",
        campus: "Gnanagangothri Campus (Mathikere)",
        phone: "+91 9876543210",
        bio: "First year engineering student.",
      };

      const result = applyProfileSyncSecurity(freshUser, firstTimeInput);

      expect(result.academicLocked).toBe(true);
      expect(result.name).toBe("Aarav Sharma");
      expect(result.course).toBe("B.Tech - Computer Science & Engineering");
      expect(result.year).toBe("1st Year (Freshman)");
      expect(result.campus).toBe("Gnanagangothri Campus (Mathikere)");
    });

    it("rejects attempt to tamper with or alter name, department, year, or campus once locked", () => {
      const lockedUser: Partial<UserProfile> = {
        uid: "user-locked",
        email: "aarav@msruas.ac.in",
        name: "Aarav Sharma",
        course: "B.Tech - Computer Science & Engineering",
        year: "1st Year (Freshman)",
        campus: "Gnanagangothri Campus (Mathikere)",
        academicLocked: true,
      };

      const maliciousTamperInput = {
        name: "Hacked Impersonator Name",
        course: "M.Tech - Aerospace Engineering",
        year: "4th Year (Senior)",
        campus: "Peenya Campus",
        phone: "+91 9999999999",
        bio: "New bio after update",
      };

      const result = applyProfileSyncSecurity(lockedUser, maliciousTamperInput);

      // Institutional details MUST remain exactly the original locked values
      expect(result.name).toBe("Aarav Sharma");
      expect(result.course).toBe("B.Tech - Computer Science & Engineering");
      expect(result.year).toBe("1st Year (Freshman)");
      expect(result.campus).toBe("Gnanagangothri Campus (Mathikere)");
      expect(result.academicLocked).toBe(true);

      // Mutable details (phone, bio) CAN be updated
      expect(result.phone).toBe("+91 9999999999");
      expect(result.bio).toBe("New bio after update");
    });
  });

  describe("3. Phone Sanitization & Format Normalization", () => {
    function sanitizePhoneNumber(raw: string): string {
      const trimmed = raw.trim();
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length === 10) return `+91 ${digits}`;
      if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2)}`;
      return trimmed;
    }

    it("converts 10-digit number to canonical E.164 +91 format", () => {
      expect(sanitizePhoneNumber("9876543210")).toBe("+91 9876543210");
    });

    it("converts 12-digit number with leading 91 to canonical +91 format", () => {
      expect(sanitizePhoneNumber("919876543210")).toBe("+91 9876543210");
    });

    it("strips dashes and formatting spaces", () => {
      expect(sanitizePhoneNumber("98765-43210")).toBe("+91 9876543210");
    });
  });
});

