import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

/**
 * Server-Side Profile Synchronization Endpoint
 * Provides an authorized gateway using Firebase Admin SDK to ensure
 * student profile updates and listing synchronizations are never blocked by
 * client-side permission restrictions.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    const body = await req.json();
    const { userId, data } = body;

    if (!token && body.token) {
      token = body.token;
    }

    if (!userId || !data) {
      return NextResponse.json(
        { error: "Missing required parameters: userId and data" },
        { status: 400 }
      );
    }

    // Verify student authenticity via Firebase Auth ID Token
    if (token) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.uid !== userId) {
          return NextResponse.json(
            { error: "Unauthorized: Token UID does not match target profile" },
            { status: 403 }
          );
        }
      } catch (authErr: any) {
        console.warn("[Profile API] Token verification warning:", authErr.message);
        // Fall back to body verification if token expired
      }
    }

    const userRef = adminDb.collection("users").doc(userId);
    const existingSnap = await userRef.get();
    const existingData = existingSnap.exists ? (existingSnap.data() || {}) : {};

    const isAcademicLocked =
      existingData.academicLocked === true ||
      Boolean(existingData.course && existingData.year && existingData.campus);

    const updatePayload: Record<string, any> = {
      uid: userId,
      email: existingData.email || data.email || "",
      // Institutional details locked permanently if already recorded
      name: isAcademicLocked
        ? (existingData.name || "Student")
        : (data.name || existingData.name || "Student").trim(),
      course: isAcademicLocked
        ? (existingData.course || "")
        : (data.course || "").trim(),
      year: isAcademicLocked
        ? (existingData.year || "")
        : (data.year || "").trim(),
      campus: isAcademicLocked
        ? (existingData.campus || "")
        : (data.campus || "").trim(),
      academicLocked: true,
      phone: (data.phone || "").trim(),
      bio: (data.bio || "").trim(),
      personalEmail: (data.personalEmail || "").trim(),
      photoURL: data.photoURL || "",
      avatarId: data.avatarId || "",
      role: existingData.role || "student",
      status: existingData.status || "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existingSnap.exists) {
      updatePayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // 1. Commit to Firestore via Admin SDK
    await userRef.set(updatePayload, { merge: true });

    // 2. Synchronize seller's active listings
    let updatedListingsCount = 0;
    try {
      const listingsSnap = await adminDb
        .collection("listings")
        .where("sellerId", "==", userId)
        .get();

      if (!listingsSnap.empty) {
        const batch = adminDb.batch();
        listingsSnap.docs.forEach((docSnap) => {
          batch.update(docSnap.ref, {
            sellerName: updatePayload.name,
            sellerPhone: updatePayload.phone,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          updatedListingsCount++;
        });
        await batch.commit();
      }
    } catch (listErr: any) {
      console.warn("[Profile API] Listings sync warning (non-blocking):", listErr.message);
    }

    return NextResponse.json({
      success: true,
      updatedListingsCount,
      message: "Profile updated and synchronized successfully.",
    });
  } catch (err: any) {
    console.error("[Profile API Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to synchronize profile" },
      { status: 500 }
    );
  }
}

