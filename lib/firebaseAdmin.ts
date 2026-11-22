
import * as admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "campus-marketplace-dev";

const useFirebaseEmulator =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

// Configure emulator hosts before initializing Firebase Admin.
if (useFirebaseEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
}

if (!admin.apps.length) {
  if (useFirebaseEmulator) {
    // Local development: no service-account credentials required.
    admin.initializeApp({ projectId });
  } else {
    // Non-emulator mode: use service-account credentials when available.
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey && clientEmail) {
      privateKey = privateKey.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      admin.initializeApp({ projectId });
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
