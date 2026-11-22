import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

export interface ProfileUpdateInput {
  name: string;
  phone?: string;
  course?: string;
  year?: string;
  campus?: string;
  bio?: string;
  personalEmail?: string;
  photoURL?: string;
  avatarId?: string;
}

/**
 * Updates the student's profile and synchronizes their updated name and contact phone
 * across their Firebase Auth session and all their active campus listings.
 */
export async function syncUserProfile(
  userId: string,
  data: ProfileUpdateInput
): Promise<{ success: boolean; updatedListingsCount: number; error?: string }> {
  try {
    const userRef = doc(db, "users", userId);

    // Fetch existing document to preserve system fields (role, status, createdAt)
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};
    const currentUserEmail = auth.currentUser?.email || existingData.email || "";

    const isAcademicLocked =
      existingData.academicLocked === true ||
      Boolean(existingData.course && existingData.year && existingData.campus);
    const photoURL = typeof data.photoURL === "string" ? data.photoURL : "";

    const trimmedData = {
      uid: userId,
      email: currentUserEmail,
      // If locked, institutional academic credentials cannot be altered
      name: isAcademicLocked
        ? (existingData.name || "Student")
        : (data.name || auth.currentUser?.displayName || "Student").trim(),
      course: isAcademicLocked
        ? (existingData.course || "")
        : (data.course || "").trim(),
      year: isAcademicLocked
        ? (existingData.year || "")
        : (data.year || "").trim(),
      campus: isAcademicLocked
        ? (existingData.campus || "")
        : (data.campus || "").trim(),
      academicLocked: true, // Permanent lock after save
      phone: (data.phone || "").trim(),
      bio: (data.bio || "").trim(),
      personalEmail: (data.personalEmail || "").trim(),
      photoURL,
      avatarId: data.avatarId || "",
      role: existingData.role || "student",
      status: existingData.status || "active",
      updatedAt: serverTimestamp(),
      ...(existingSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    };

    let updatedListingsCount = 0;
    let clientWriteFailed = false;

    // 1. Upsert Firestore User Profile Document (safe against missing doc)
    try {
      await setDoc(userRef, trimmedData, { merge: true });
    } catch (writeErr: any) {
      console.warn("[ProfileSync] Direct client Firestore write warning:", writeErr.message);
      clientWriteFailed = true;
    }

    // If client write failed (e.g. permission or network constraint), fallback to Server-Side Admin API
    if (clientWriteFailed) {
      try {
        const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => "") : "";
        const apiRes = await fetch("/api/profile/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
          },
          body: JSON.stringify({ userId, data, token: idToken }),
        });

        const apiJson = await apiRes.json();
        if (!apiRes.ok || !apiJson.success) {
          throw new Error(apiJson.error || "Server profile sync failed");
        }
        updatedListingsCount = apiJson.updatedListingsCount || 0;
      } catch (fallbackErr: any) {
        console.error("[ProfileSync] Server fallback error:", fallbackErr.message);
        throw fallbackErr;
      }
    }

    // 2. Synchronize Firebase Auth Profile (displayName & photoURL)
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        const authProfileUpdate: { displayName: string; photoURL?: string } = {
          displayName: trimmedData.name,
        };
        if (typeof data.photoURL === "string") {
          authProfileUpdate.photoURL = photoURL;
        }
        await updateFirebaseProfile(auth.currentUser, authProfileUpdate);
      } catch (authErr) {
        console.warn("[ProfileSync] Firebase Auth profile update warning:", authErr);
      }
    }

    // 3. If client write succeeded, synchronize active listings directly
    if (!clientWriteFailed) {
      try {
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("sellerId", "==", userId));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.docs.forEach((listingDoc) => {
            batch.update(listingDoc.ref, {
              sellerName: trimmedData.name,
              sellerPhone: trimmedData.phone,
              updatedAt: serverTimestamp(),
            });
            updatedListingsCount++;
          });
          await batch.commit();
        }
      } catch (listErr) {
        console.warn("[ProfileSync] Warning synchronizing seller listings:", listErr);
      }
    }

    return {
      success: true,
      updatedListingsCount,
    };
  } catch (err: any) {
    console.error("[ProfileSync] Error updating profile:", err);
    return {
      success: false,
      updatedListingsCount: 0,
      error: err.message || "Failed to update profile",
    };
  }
}

/**
 * Fetches the live, up-to-date public profile for any student UID.
 */
export async function fetchLiveStudentProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  try {
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) {
      return { uid: snap.id, ...snap.data() } as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn(`[ProfileSync] Failed to fetch student profile (${userId}):`, err);
    return null;
  }
}

