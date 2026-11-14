import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { sendOtpEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    // 1. Strict domain & format validation
    const validation = validateUniversityEmail(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid university email domain." },
        { status: 400 }
      );
    }

    const normalizedEmail = validation.normalizedEmail;

    // 2. Check if user account already exists in Firebase Auth
    try {
      const existingUser = await adminAuth.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return NextResponse.json(
          {
            error: "An account with this email already exists. Please log in instead.",
            code: "ACCOUNT_EXISTS",
          },
          { status: 409 }
        );
      }
    } catch (authError: any) {
      // 'auth/user-not-found' is expected and normal for registration
      if (authError.code !== "auth/user-not-found") {
        console.error("[Auth Lookup Error]:", authError.message);
      }
    }

    // 3. Hash email to create a safe document ID for otpRequests
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
    const otpDocRef = adminDb.collection("otpRequests").doc(emailHash);
    const existingOtpSnap = await otpDocRef.get();

    const now = Date.now();
    let hourlyCount = 1;
    let hourWindowStart = now;

    if (existingOtpSnap.exists) {
      const data = existingOtpSnap.data();
      const lastSentAt = data?.lastSentAt || 0;
      const cooldownRemainingMs = 60 * 1000 - (now - lastSentAt);

      // Rate limit: 1 OTP per 60 seconds
      if (cooldownRemainingMs > 0) {
        const secondsLeft = Math.ceil(cooldownRemainingMs / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${secondsLeft} seconds before requesting another code.`,
            cooldownSeconds: secondsLeft,
          },
          { status: 429 }
        );
      }

      // Rate limit: 5 OTPs per hour
      const prevHourStart = data?.hourWindowStart || 0;
      if (now - prevHourStart < 3600 * 1000) {
        if ((data?.hourlyCount || 0) >= 5) {
          return NextResponse.json(
            { error: "Too many attempts. Maximum 5 verification codes per hour." },
            { status: 429 }
          );
        }
        hourlyCount = (data?.hourlyCount || 0) + 1;
        hourWindowStart = prevHourStart;
      }
    }

    // 4. Generate 6-digit random code
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    // 5. Store HMAC-SHA256 of the OTP (never plain text)
    const hmacSecret = process.env.OTP_HMAC_SECRET || "default-campus-secret-key-change-me";
    const hashedCode = crypto
      .createHmac("sha256", hmacSecret)
      .update(otpCode)
      .digest("hex");

    const expiresAt = now + 10 * 60 * 1000; // 10 minutes

    await otpDocRef.set({
      hashedCode,
      expiresAt,
      attempts: 0,
      lastSentAt: now,
      hourlyCount,
      hourWindowStart,
      normalizedEmail,
    });

    // 6. Send Email via Gmail SMTP
    const mailResult = await sendOtpEmail({
      toEmail: normalizedEmail,
      otpCode,
    });

    if (!mailResult.success) {
      return NextResponse.json(
        { error: mailResult.error || "Failed to deliver verification code." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your student email.",
    });
  } catch (error: any) {
    console.error("[request-otp error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

