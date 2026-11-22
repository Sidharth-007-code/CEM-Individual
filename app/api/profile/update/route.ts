
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import * as admin from "firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Require and verify Firebase authentication.
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication token is missing." },
        { status: 401 }
      );
    }

    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired authentication token." },
        { status: 401 }
      );
    }

    // 2. Parse and validate the request.
    const body = await req.json();
    const { userId, data } = body;

    if (
      typeof userId !== "string" ||
      !userId ||
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return NextResponse.json(
        { error: "Invalid profile update request." },
        { status: 400 }
      );
    }

    if (decodedToken.uid !== userId) {
      return NextResponse.json(
        { error: "You cannot update another user's profile." },
        { status: 403 }
      );
    }

    // 3. Only accept explicitly supported profile fields.
    const allowedFields = [
      "name",
      "phone",
      "course",
      "year",
      "campus",
      "bio",
      "personalEmail",
      "photoURL",
      "avatarId",
    ];

    const invalidFields = Object.keys(data).filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: "Profile update contains unsupported fields." },
        { status: 400 }
      );
    }

    for (const field of allowedFields) {
      if (
        data[field] !== undefined &&
        typeof data[field] !== "string"
      ) {
        return NextResponse.json(
          { error: `Invalid value for ${field}.` },
          { status: 400 }
        );
      }
    }

    const userRef = adminDb.collection("users").doc(userId);
    const existingSnap = await userRef.get();
    const existingData = existingSnap.exists
      ? existingSnap.data() || {}
      : {};

    // 4. Preserve institutional fields after their first lock.
    const isAcademicLocked =
      existingData.academicLocked === true ||
      Boolean(
        existingData.course &&
        existingData.year &&
        existingData.campus
      );

    const authEmail = decodedToken.email || "";

    if (
      existingData.email &&
      authEmail &&
      existingData.email !== authEmail
    ) {
      return NextResponse.json(
        { error: "Authenticated email does not match the profile." },
        { status: 403 }
      );
    }

    const clean = (value: unknown, fallback = "") =>
      typeof value === "string" ? value.trim() : fallback;

    const updatePayload: Record<string, any> = {
      uid: userId,
      email: authEmail || existingData.email || "",
      name: isAcademicLocked
        ? existingData.name || "Student"
        : clean(data.name, existingData.name || "Student"),
      course: isAcademicLocked
        ? existingData.course || ""
        : clean(data.course, existingData.course || ""),
      year: isAcademicLocked
        ? existingData.year || ""
        : clean(data.year, existingData.year || ""),
      campus: isAcademicLocked
        ? existingData.campus || ""
        : clean(data.campus, existingData.campus || ""),
      academicLocked: true,
      phone: clean(data.phone, existingData.phone || ""),
      bio: clean(data.bio, existingData.bio || ""),
      personalEmail: clean(
        data.personalEmail,
        existingData.personalEmail || ""
      ),
      photoURL: clean(data.photoURL, existingData.photoURL || ""),
      avatarId: clean(data.avatarId, existingData.avatarId || ""),
      role: existingData.role || "student",
      status: existingData.status || "active",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existingSnap.exists) {
      updatePayload.createdAt =
        admin.firestore.FieldValue.serverTimestamp();
    }

    // 5. Save the authenticated user's profile.
    await userRef.set(updatePayload, { merge: true });

    // 6. Synchronize seller details across their listings.
    let updatedListingsCount = 0;

    try {
      const listingsSnap = await adminDb
        .collection("listings")
        .where("sellerId", "==", userId)
        .get();

      if (!listingsSnap.empty) {
        const batch = adminDb.batch();

        listingsSnap.docs.forEach((listingDoc) => {
          batch.update(listingDoc.ref, {
            sellerName: updatePayload.name,
            sellerPhone: updatePayload.phone,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          updatedListingsCount++;
        });

        await batch.commit();
      }
    } catch (listErr: any) {
      console.error(
        "[Profile API] Listing synchronization failed:",
        listErr.message
      );

      return NextResponse.json(
        { error: "Profile saved, but listing synchronization failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedListingsCount,
      message: "Profile updated successfully.",
    });
  } catch (err: any) {
    console.error("[Profile API Error]:", err);

    return NextResponse.json(
      { error: "Failed to synchronize profile." },
      { status: 500 }
    );
  }
}
