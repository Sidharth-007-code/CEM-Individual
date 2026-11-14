import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "campus-marketplace-dev.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "campus-marketplace-dev",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "campus-marketplace-dev.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
};

// Singleton pattern to prevent re-initializing in Next.js hot-reloads
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to local emulators ONLY if explicitly configured
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

let emulatorsConnected = false;

if (typeof window !== "undefined" && useEmulator && !emulatorsConnected) {
  // Prevent duplicate emulator connection warnings in Next.js fast-refresh
  const g = window as any;
  if (!g.__FIREBASE_EMULATORS_CONNECTED__) {
    try {
      const authUrl = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
      connectAuthEmulator(auth, authUrl, { disableWarnings: true });
      
      const host = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
      const port = Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080);
      connectFirestoreEmulator(db, host, port);

      g.__FIREBASE_EMULATORS_CONNECTED__ = true;
      emulatorsConnected = true;
      // Log for developer awareness
      console.log(`[Firebase Client] Connected to local Emulators (Auth: ${authUrl}, Firestore: ${host}:${port})`);
    } catch (e: any) {
      // Ignore if already connected
      if (!e.message?.includes("already")) {
        console.warn("[Firebase Client] Emulator connection warning:", e.message);
      }
    }
  }
}

export { app, auth, db };

