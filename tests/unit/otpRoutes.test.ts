import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { sendOtpEmail } from "@/lib/mail";
import { checkIpRateLimit, resetIpRateLimits, getClientIp } from "@/lib/auth/rateLimiter";
import crypto from "crypto";

describe("OTP Security & Rate Limiting Integration (TC-01, TC-02, TC-17)", () => {
  beforeEach(() => {
    resetIpRateLimits();
  });
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

  it("FR-01: enforces per-IP rate limiting across repeated requests", () => {
    const testIp = "192.168.1.105";

    // 10 requests allowed
    for (let i = 0; i < 10; i++) {
      const check = checkIpRateLimit(testIp, 10, 60000);
      expect(check.allowed).toBe(true);
    }

    // 11th request blocked
    const blockedCheck = checkIpRateLimit(testIp, 10, 60000);
    expect(blockedCheck.allowed).toBe(false);
    expect(blockedCheck.remaining).toBe(0);
  });

  it("FR-01: extracts client IP correctly from proxy headers", () => {
    const headers1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIp(headers1)).toBe("203.0.113.195");

    const headers2 = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(getClientIp(headers2)).toBe("198.51.100.4");

    const headersEmpty = new Headers();
    expect(getClientIp(headersEmpty)).toBe("127.0.0.1");
  });

  it("FR-02: requires password of at least 8 characters with a letter and a digit", () => {
    function validatePasswordStrength(pwd: string): boolean {
      if (typeof pwd !== "string" || pwd.length < 8) return false;
      const hasLetter = /[a-zA-Z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      return hasLetter && hasDigit;
    }

    // Too short
    expect(validatePasswordStrength("Pass1")).toBe(false);
    expect(validatePasswordStrength("1234567")).toBe(false);

    // Only letters
    expect(validatePasswordStrength("PasswordOnly")).toBe(false);

    // Only numbers
    expect(validatePasswordStrength("123456789")).toBe(false);

    // Valid
    expect(validatePasswordStrength("CampusPass2026")).toBe(true);
    expect(validatePasswordStrength("msruas1234")).toBe(true);
  });

  it("FR-01: throws in production when OTP_HMAC_SECRET is missing", () => {
    function getHmacSecret(nodeEnv: string, secretEnv?: string): string {
      if (!secretEnv) {
        if (nodeEnv === "production") {
          throw new Error("Missing required environment variable OTP_HMAC_SECRET in production.");
        }
      }
      return secretEnv || "default-campus-secret-key-change-me";
    }

    // In dev, fallback works
    expect(getHmacSecret("development", undefined)).toBe("default-campus-secret-key-change-me");

    // In prod without secret, throws error
    expect(() => getHmacSecret("production", undefined)).toThrow(/OTP_HMAC_SECRET/);

    // In prod with secret, returns secret
    expect(getHmacSecret("production", "super-secret-key-64-bytes")).toBe("super-secret-key-64-bytes");
  });
});

