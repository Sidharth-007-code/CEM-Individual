import { describe, it, expect } from "vitest";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";

describe("validateUniversityEmail (FR-01 Security Domain Guard)", () => {
  it("accepts valid primary institutional domain emails", () => {
    const res1 = validateUniversityEmail("rahul.cs22@msruas.ac.in");
    expect(res1.isValid).toBe(true);
    expect(res1.normalizedEmail).toBe("rahul.cs22@msruas.ac.in");

    const res2 = validateUniversityEmail("  DEAN.OFFICE@MSRUAS.AC.IN  ");
    expect(res2.isValid).toBe(true);
    expect(res2.normalizedEmail).toBe("dean.office@msruas.ac.in");
  });

  it("accepts valid student and departmental subdomains", () => {
    const res1 = validateUniversityEmail("priya.p@student.msruas.ac.in");
    expect(res1.isValid).toBe(true);

    const res2 = validateUniversityEmail("lab.admin@cse.faculty.msruas.ac.in");
    expect(res2.isValid).toBe(true);
  });

  it("strictly rejects look-alike phishing domains (TC-02 security test)", () => {
    // Suffix phishing
    const res1 = validateUniversityEmail("hacker@msruas.ac.in.evil.com");
    expect(res1.isValid).toBe(false);

    // Prefix collision
    const res2 = validateUniversityEmail("hacker@evilmsruas.ac.in");
    expect(res2.isValid).toBe(false);

    // Typo squatting
    const res3 = validateUniversityEmail("hacker@msruas-ac.in");
    expect(res3.isValid).toBe(false);

    // Fake TLD suffix
    const res4 = validateUniversityEmail("hacker@msruas.ac.in.co");
    expect(res4.isValid).toBe(false);

    // Subdomain mimic
    const res5 = validateUniversityEmail("victim@fake-msruas.ac.in");
    expect(res5.isValid).toBe(false);
  });

  it("rejects public consumer email providers", () => {
    expect(validateUniversityEmail("student@gmail.com").isValid).toBe(false);
    expect(validateUniversityEmail("student@outlook.com").isValid).toBe(false);
    expect(validateUniversityEmail("student@yahoo.co.in").isValid).toBe(false);
  });

  it("rejects malformed or empty inputs", () => {
    expect(validateUniversityEmail("").isValid).toBe(false);
    expect(validateUniversityEmail("   ").isValid).toBe(false);
    expect(validateUniversityEmail("not-an-email").isValid).toBe(false);
    expect(validateUniversityEmail("@msruas.ac.in").isValid).toBe(false);
    expect(validateUniversityEmail("user@").isValid).toBe(false);
  });
});

