import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as admin from "firebase-admin";
import { validateUniversityEmail } from "@/lib/auth/emailValidator";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp, password, name, year, course, phone, personalEmail } = body;

    // 1. Validate inputs
    if (!email || !otp || !password || !name) {
      return NextResponse.json(
        { error: "Email, verification code, password, and full name are required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const validation = validateUniversityEmail(email);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid university email." },
        { status: 400 }
      );
    }
    const normalizedEmail = validation.normalizedEmail;

    // 2. Fetch OTP Document
    const emailHash = crypto.createHash("sha256").update(normalizedEmail).digest("hex");
    const otpDocRef = adminDb.collection("otpRequests").doc(emailHash);
    const otpSnap = await otpDocRef.get();

    if (!otpSnap.exists) {
      return NextResponse.json(
        { error: "No pending verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    const otpData = otpSnap.data();
    const now = Date.now();

    // 3. Expiration Check (10 Minutes)
    if (now > (otpData?.expiresAt || 0)) {
      await otpDocRef.delete();
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 4. Max Attempts Check (Max 5 attempts)
    const currentAttempts = (otpData?.attempts || 0) + 1;
    if (currentAttempts > 5) {
      await otpDocRef.delete();
      return NextResponse.json(
        { error: "Maximum attempts exceeded. Please request a new verification code." },
        { status: 429 }
      );
    }

    // Increment attempt counter in Firestore
    await otpDocRef.update({ attempts: currentAttempts });

    // 5. Compare Hashes with timingSafeEqual
    const hmacSecret = process.env.OTP_HMAC_SECRET || "default-campus-secret-key-change-me";
    const userProvidedHash = crypto
      .createHmac("sha256", hmacSecret)
      .update(otp.trim())
      .digest("hex");

    const storedHash = otpData?.hashedCode || "";

    const userHashBuf = Buffer.from(userProvidedHash, "hex");
    const storedHashBuf = Buffer.from(storedHash, "hex");

    const isMatch =
      userHashBuf.length === storedHashBuf.length &&
      crypto.timingSafeEqual(userHashBuf, storedHashBuf);

    if (!isMatch) {
      const remaining = 5 - currentAttempts;
      return NextResponse.json(
        {
          error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
          remainingAttempts: remaining,
        },
        { status: 400 }
      );
    }

    // 6. Delete OTP Document on successful match
    await otpDocRef.delete();

    // 7. Create Firebase Auth User via Admin SDK
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: normalizedEmail,
        password,
        displayName: name.trim(),
        emailVerified: true,
      });
    } catch (createError: any) {
      if (createError.code === "auth/email-already-exists") {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }
      console.error("[User Creation Error]:", createError.message);
      return NextResponse.json(
        { error: "Failed to create user account. Please try again." },
        { status: 500 }
      );
    }

    // 8. Provision Firestore user profile in users/{uid}
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: name.trim(),
      email: normalizedEmail,
      role: "student", // Always initialized to student
      status: "active",
      year: year ? String(year).trim() : "",
      course: course ? String(course).trim() : "",
      phone: phone ? String(phone).trim() : "",
      personalEmail: personalEmail ? String(personalEmail).trim() : "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Student account created successfully. You may now log in.",
      uid: userRecord.uid,
    });
  } catch (error: any) {
    console.error("[verify-otp error]:", error);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}

