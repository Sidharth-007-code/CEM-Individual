"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types/user";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isStudent: boolean;
  isVerifier: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  studentMode: "buy" | "sell";
  setStudentMode: (mode: "buy" | "sell") => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: "student",
  isStudent: true,
  isVerifier: false,
  isAdmin: false,
  isSuspended: false,
  studentMode: "buy",
  setStudentMode: () => {},
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentMode, setStudentModeState] = useState<"buy" | "sell">("buy");

  // Restore preferred mode from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("campus_mode");
      if (savedMode === "sell" || savedMode === "buy") {
        setStudentModeState(savedMode);
      }
    }
  }, []);

  const setStudentMode = (mode: "buy" | "sell") => {
    setStudentModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("campus_mode", mode);
    }
  };

  // 10-Minute Automatic Inactivity Logout for Campus Security
  // STRICT RULE: Session timeout MUST ONLY take place if there is NO user activity for 10 consecutive minutes.
  // Synchronized across multiple browser tabs via localStorage so active browsing in one tab preserves the session.
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const STORAGE_KEY = "campus_last_active";
    let lastThrottledRecord = 0;

    // Record activity timestamp in current tab and across tabs
    const recordUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 2 seconds
      if (now - lastThrottledRecord > 2000) {
        lastThrottledRecord = now;
        try {
          localStorage.setItem(STORAGE_KEY, now.toString());
        } catch (e) {
          // localStorage might be unavailable or full
        }
      }
    };

    const performInactivityLogout = async () => {
      console.warn("[Security] User session expired after 10 full minutes of inactivity across all tabs.");
      try {
        await firebaseSignOut(auth);
      } catch (e) {}
      setProfile(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
    };

    // Initialize last active timestamp on login
    recordUserActivity();

    // Comprehensive interaction events to detect active user presence
    const interactionEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
      "click",
      "wheel",
      "focus",
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Synchronize across tabs when user interacts in another window
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        lastThrottledRecord = Date.now();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // When student returns to tab, check if they were active in another tab or just woke the screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const storedTime = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        if (storedTime && now - storedTime < INACTIVITY_TIMEOUT_MS) {
          recordUserActivity();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Heartbeat checker: checks every 15 seconds if true idle time exceeded 10 minutes
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const storedTime = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      const lastActive = storedTime || lastThrottledRecord || now;
      const elapsed = now - lastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(heartbeatInterval);
        performInactivityLogout();
      }
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      interactionEvents.forEach((evt) => {
        window.removeEventListener(evt, recordUserActivity);
      });
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Real-time listener for user profile document
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubscribeDoc = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Auto-provision initial Firestore document for the authenticated student
            const initialData: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Student",
              email: firebaseUser.email || "",
              role: "student",
              status: "active",
              course: "B.Tech - Engineering",
              year: "1st Year",
              phone: "",
              campus: "Gnanagangothri Campus (Mathikere)",
            };
            setProfile(initialData);

            // Persist into Firestore so exists(users/{uid}) and status == 'active' are guaranteed
            setDoc(
              userDocRef,
              {
                ...initialData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            ).catch((err) => {
              console.warn("[AuthContext] Auto-provision user doc warning:", err.message);
            });
          }
          setLoading(false);
        },
        (error) => {
          console.warn("[AuthContext] Profile subscription warning:", error.message);
          setLoading(false);
        }
      );

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    } catch (e) {
      console.error("[AuthContext] Failed to refresh profile:", e);
    }
  };

  const role: UserRole = profile?.role || "student";
  const isSuspended = profile?.status === "suspended";
  const isStudent = role === "student";
  const isVerifier = role === "verifier" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role,
        isStudent,
        isVerifier,
        isAdmin,
        isSuspended,
        studentMode,
        setStudentMode,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

