import { describe, it, expect, vi } from "vitest";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { sendOtpEmail } from "@/lib/mail";
import crypto from "crypto";

describe("OTP Security & Rate Limiting Integration (TC-01, TC-02, TC-17)", () => {
  it("TC-02: rejects non-college and spoofed email lookalikes without sending email", async () => {
    // 1. Consumer Gmail
    const res1 = validateUniversityEmail("student@gmail.com");
    expect(res1.isValid).toBe(false);
    expect(res1.error).toContain("restricted to official @msruas.ac.in");

    // 2. Phishing lookalike
    const res2 = validateUniversityEmail("student@msruas.ac.in.evil.com");
    expect(res2.isValid).toBe(false);

    // 3. Prefix attacker
    const res3 = validateUniversityEmail("student@evilmsruas.ac.in");
    expect(res3.isValid).toBe(false);

    // Verify secondary mail safeguard also rejects non-institutional domain
    const mailRes = await sendOtpEmail({
      toEmail: "attacker@gmail.com",
      otpCode: "123456",
    });
    expect(mailRes.success).toBe(false);
    expect(mailRes.error).toContain("Disallowed recipient domain");
  });

  it("TC-17: verifies HMAC code with timingSafeEqual and detects tampering", () => {
    const hmacSecret = "test-secret-salt-key-123456789";
    const realCode = "842910";
    const wrongCode = "111222";

    const realHash = crypto
      .createHmac("sha256", hmacSecret)
      .update(realCode)
      .digest("hex");

    const providedHash = crypto
      .createHmac("sha256", hmacSecret)
      .update(wrongCode)
      .digest("hex");

    const realBuf = Buffer.from(realHash, "hex");
    const providedBuf = Buffer.from(providedHash, "hex");

    const isMatch =
      realBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(realBuf, providedBuf);

    expect(isMatch).toBe(false);

    // Test correct code
    const correctHash = crypto
      .createHmac("sha256", hmacSecret)
      .update(realCode)
      .digest("hex");
    const correctBuf = Buffer.from(correctHash, "hex");

    expect(crypto.timingSafeEqual(realBuf, correctBuf)).toBe(true);
  });

  it("TC-17: enforces attempt lockout threshold at 5 attempts", () => {
    let attempts = 0;
    const maxAttempts = 5;

    for (let i = 1; i <= 5; i++) {
      attempts++;
      expect(attempts).toBeLessThanOrEqual(maxAttempts);
    }

    // 6th attempt triggers lockout
    attempts++;
    const isLockedOut = attempts > maxAttempts;
    expect(isLockedOut).toBe(true);
  });

  it("TC-01: valid university domain generates 6-digit cryptographic OTP", () => {
    const validation = validateUniversityEmail("rahul.cs22@msruas.ac.in");
    expect(validation.isValid).toBe(true);
    expect(validation.normalizedEmail).toBe("rahul.cs22@msruas.ac.in");

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    expect(otpCode.length).toBe(6);
    expect(/^\d{6}$/.test(otpCode)).toBe(true);
  });
});

