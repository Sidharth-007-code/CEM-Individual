import * as admin from "firebase-admin";

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "campus-marketplace-dev";

// Ensure emulator env vars are set if not provided
if (!process.env.FIRESTORE_EMULATOR_HOST && (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || !process.env.FIREBASE_PRIVATE_KEY)) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || !process.env.FIREBASE_PRIVATE_KEY)) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
}

if (!admin.apps.length) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey && clientEmail) {
    // Replace escaped newlines if passed via environment variable
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
    // Emulator / Default App mode
    admin.initializeApp({
      projectId,
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

