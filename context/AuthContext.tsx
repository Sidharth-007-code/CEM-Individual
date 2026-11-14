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
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    let timeoutId: NodeJS.Timeout;

    const performInactivityLogout = async () => {
      console.warn("[Security] User session expired after 10 minutes of inactivity.");
      await firebaseSignOut(auth);
      setProfile(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=session_expired";
      }
    };

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performInactivityLogout, INACTIVITY_TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((evt) => window.addEventListener(evt, resetInactivityTimer, { passive: true }));

    // Initialize timer on login
    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
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

