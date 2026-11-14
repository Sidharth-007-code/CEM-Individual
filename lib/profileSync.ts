import { doc, updateDoc, collection, query, where, getDocs, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types/user";

export interface ProfileUpdateInput {
  name: string;
  phone: string;
  course: string;
  year: string;
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

    const trimmedData = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      course: data.course.trim(),
      year: data.year.trim(),
      campus: (data.campus || "").trim(),
      bio: (data.bio || "").trim(),
      personalEmail: (data.personalEmail || "").trim(),
      photoURL: data.photoURL || "",
      avatarId: data.avatarId || "",
      updatedAt: serverTimestamp(),
    };

    // 1. Update Firestore User Profile Document
    await updateDoc(userRef, trimmedData);

    // 2. Synchronize Firebase Auth Profile (displayName & photoURL)
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: trimmedData.name,
          photoURL: trimmedData.photoURL || null,
        });
      } catch (authErr) {
        console.warn("[ProfileSync] Firebase Auth profile update warning:", authErr);
      }
    }

    // 3. Synchronize across all seller's active campus listings so "Call Seller" & seller tags stay updated
    let updatedListingsCount = 0;
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
