"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  isWarningVisible: boolean;
  secondsRemaining: number;
  resetActivityTimer: () => void;
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
  isWarningVisible: false,
  secondsRemaining: 60,
  resetActivityTimer: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentMode, setStudentModeState] = useState<"buy" | "sell">("buy");
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

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

  const resetActivityTimer = () => {
    const now = Date.now();
    try {
      localStorage.setItem("campus_last_active", now.toString());
    } catch (e) {}
    setIsWarningVisible(false);
    setSecondsRemaining(60);
  };

  // 10-Minute Automatic Inactivity Logout for Campus Security
  // STRICT RULE: Session timeout MUST ONLY take place if there is NO user activity for 10 consecutive minutes.
  // Synchronized across multiple browser tabs via localStorage so active browsing in one tab preserves the session.
  useEffect(() => {
    if (!user) {
      setIsWarningVisible(false);
      setSecondsRemaining(60);
      return;
    }

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (600,000ms)
    const WARNING_THRESHOLD_MS = 9 * 60 * 1000;   // 9 minutes (540,000ms)
    const STORAGE_KEY = "campus_last_active";
    let lastThrottledRecord = Date.now();

    // Record activity timestamp in current tab and across tabs
    const recordUserActivity = () => {
      const now = Date.now();
      // If warning modal was open and user interacts, immediately dismiss it
      setIsWarningVisible(false);
      setSecondsRemaining(60);

      // Throttle localStorage writes to once every 2 seconds for performance
      if (now - lastThrottledRecord > 2000) {
        lastThrottledRecord = now;
        try {
          localStorage.setItem(STORAGE_KEY, now.toString());
        } catch (e) {}
      }
    };

    const performInactivityLogout = async () => {
      console.warn("[Security] User session expired after 10 full minutes of inactivity across all tabs.");
      setIsWarningVisible(false);
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
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (e) {}
    lastThrottledRecord = Date.now();

    // Comprehensive interaction events to detect active user presence
    const interactionEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "keypress",
      "keyup",
      "scroll",
      "touchstart",
      "pointerdown",
      "click",
      "wheel",
      "focus",
      "input",
      "change",
    ];

    interactionEvents.forEach((evt) => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Synchronize across tabs when user interacts in another window
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime)) {
          lastThrottledRecord = Math.max(lastThrottledRecord, remoteTime);
          setIsWarningVisible(false);
          setSecondsRemaining(60);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // When student returns to tab, check if they were active in another tab or just woke the screen
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        const storedTime = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
        const lastActive = Math.max(storedTime || 0, lastThrottledRecord);
        if (now - lastActive < INACTIVITY_TIMEOUT_MS) {
          recordUserActivity();
        } else {
          performInactivityLogout();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Heartbeat checker: checks every second for smooth countdown and timely 10-minute timeout
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const storedTime = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      const lastActive = Math.max(storedTime || 0, lastThrottledRecord || now);
      const elapsed = now - lastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        clearInterval(heartbeatInterval);
        performInactivityLogout();
      } else if (elapsed >= WARNING_THRESHOLD_MS) {
        setIsWarningVisible(true);
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
      } else {
        setIsWarningVisible(false);
        setSecondsRemaining(60);
      }
    }, 1000);

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
    let activeProfileUid: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Auth callbacks do not use returned values, so explicitly tear down the
      // prior profile listener before handling logout or an account switch.
      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;
      activeProfileUid = firebaseUser?.uid ?? null;
      setUser(firebaseUser);
      setProfile(null);
      setLoading(true);

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      // Real-time listener for user profile document
      const userDocRef = doc(db, "users", firebaseUser.uid);
      profileUnsubscribeRef.current = onSnapshot(
        userDocRef,
        (snap) => {
          if (
            activeProfileUid !== firebaseUser.uid ||
            auth.currentUser?.uid !== firebaseUser.uid
          ) return;

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
          if (
            activeProfileUid !== firebaseUser.uid ||
            auth.currentUser?.uid !== firebaseUser.uid
          ) return;

          console.warn("[AuthContext] Profile subscription warning:", error.message);
          setProfile(null);
          setLoading(false);
        }
      );
    });

    return () => {
      activeProfileUid = null;
      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;
      unsubscribeAuth();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signOut = async () => {
    profileUnsubscribeRef.current?.();
    profileUnsubscribeRef.current = null;
    await firebaseSignOut(auth);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const requestedUid = user.uid;
    try {
      const snap = await getDoc(doc(db, "users", requestedUid));
      if (auth.currentUser?.uid !== requestedUid) return;

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
        isWarningVisible,
        secondsRemaining,
        resetActivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

