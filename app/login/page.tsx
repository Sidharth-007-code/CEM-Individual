"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, AlertCircle, RefreshCw, KeyRound, Clock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push(redirectUrl);
    }
  }, [user, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      const code = err.code;
      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Invalid university email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Account temporarily locked due to failed attempts. Please wait a moment.");
      } else {
        setError(err.message || "Failed to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 sm:p-8 shadow-card">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-paper-200 text-ink-900 mb-1 border border-ink-300">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
            Student Login
          </h1>
          <p className="text-xs text-ink-600">
            Access your campus marketplace listings, chats, and orders.
          </p>
        </div>

        {sessionExpired && !error && (
          <div className="mb-5 p-3.5 bg-saffron-50 border border-saffron-500/40 rounded-notice text-xs text-saffron-900 flex items-start space-x-2">
            <Clock className="w-4 h-4 text-saffron-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-serif">Session Timed Out</strong>
              <span>You were automatically logged out after 10 minutes of inactivity for your security. Please sign in again.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-admin-50 border border-admin-600/40 rounded-notice text-xs text-admin-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@msruas.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ink-950 hover:bg-ink-900 text-paper-50 font-serif font-bold text-sm tracking-wide rounded-notice shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Marketplace</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-ink-200 text-center text-xs text-ink-600">
          First time on Campus Marketplace?{" "}
          <Link href="/register" className="font-serif font-bold text-saffron-600 hover:text-saffron-700 underline">
            Verify university email & register
          </Link>
        </div>
      </div>

      {/* Demo Credentials Quick Switcher */}
      <div className="p-4 bg-paper-200/80 border border-ink-300 rounded-notice space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-serif font-bold text-ink-900 uppercase tracking-wider flex items-center">
            <span className="w-2 h-2 rounded-full bg-saffron-500 mr-2" />
            Quick Demo Accounts (Campus Demo Accounts)
          </span>
          <span className="text-[10px] font-mono text-ink-600">Click to autofill</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setDemoCredentials("aarav.sharma@msruas.ac.in", "StudentPass@2024")}
            className="p-2 text-left bg-paper-50 hover:bg-saffron-50 border border-ink-200 rounded transition"
          >
            <div className="font-bold text-ink-900">Student (Seller)</div>
            <div className="text-[11px] text-ink-600 truncate">aarav.sharma@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("priya.patel@msruas.ac.in", "StudentPass@2024")}
            className="p-2 text-left bg-paper-50 hover:bg-saffron-50 border border-ink-200 rounded transition"
          >
            <div className="font-bold text-ink-900">Student (Buyer)</div>
            <div className="text-[11px] text-ink-600 truncate">priya.patel@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("verifier@msruas.ac.in", "CampusVerifier@2024")}
            className="p-2 text-left bg-verifier-50 hover:bg-verifier-100 border border-verifier-600/30 rounded transition"
          >
            <div className="font-bold text-verifier-900">Verifier</div>
            <div className="text-[11px] text-verifier-700 truncate">verifier@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("admin@msruas.ac.in", "CampusAdmin@2024")}
            className="p-2 text-left bg-admin-50 hover:bg-admin-100 border border-admin-600/30 rounded transition"
          >
            <div className="font-bold text-admin-900">Administrator</div>
            <div className="text-[11px] text-admin-700 truncate">admin@msruas.ac.in</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-serif text-ink-600">Loading student sign in portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
