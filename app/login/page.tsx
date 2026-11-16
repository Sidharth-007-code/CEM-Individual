"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, AlertCircle, RefreshCw, Eye, EyeOff, Clock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith(`@msruas.ac.in`) && !trimmedEmail.endsWith(`.msruas.ac.in`)) {
      setError("Please use your official university email ending in @msruas.ac.in");
      return;
    }

    setLoading(true);

    try {
      await signIn(trimmedEmail, password);
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

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* ────────────────── NEO-BRUTALIST "WELCOME BACK!" CARD ────────────────── */}
      <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-lg relative overflow-hidden bg-grid-pattern">
        
        {/* Yellow Top-Left Decorative Tab with Interlocking Logo */}
        <div className="absolute top-0 left-0 bg-brutal-yellow border-r-2 border-b-2 border-black rounded-br-2xl px-4 py-2.5 shadow-[2px_2px_0px_#000]">
          <Logo size="sm" withText={false} badgeOnly={true} href="" />
        </div>

        {/* Center Header */}
        <div className="text-center space-y-1.5 pt-6 mb-6">
          <h1 className="font-sans font-black text-3xl text-black tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-xs font-semibold text-ink-600">
            Sign in to continue to Campus Marketplace
          </p>
        </div>

        {sessionExpired && !error && (
          <div className="mb-5 p-3.5 bg-brutal-yellow/30 border-2 border-black rounded-2xl text-xs text-black flex items-start space-x-2.5 shadow-[2px_2px_0px_#000]">
            <Clock className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-sans font-black">Session Timed Out</strong>
              <span className="font-medium">You were automatically logged out after 10 minutes of inactivity for your security.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-brutal-pink border-2 border-black rounded-2xl text-xs text-black flex items-start space-x-2.5 shadow-[2px_2px_0px_#000]">
            <AlertCircle className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field with Neo-brutalist border */}
          <div>
            <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
              University Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@msruas.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-sans font-medium text-black placeholder-ink-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
              />
            </div>
            <p className="text-[11px] font-mono text-ink-500 mt-1">
              Restricted to verified @msruas.ac.in credentials.
            </p>
          </div>

          {/* Password Field with Show/Hide Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-sans font-medium text-black placeholder-ink-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-black hover:opacity-75 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Yellow Sign In Button with Hard Shadow */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm tracking-wide rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t-2 border-black/10 text-center text-xs text-ink-700 font-medium">
          First time on Campus Marketplace?{" "}
          <Link href="/register" className="font-sans font-black text-black underline underline-offset-4 hover:text-brutal-purple-dark">
            Verify student email &amp; register
          </Link>
        </div>
      </div>

      {/* Institutional Security Notice & Help Desk */}
      <div className="p-4 bg-paper-50 border-2 border-black rounded-2xl shadow-brutal text-center space-y-1.5">
        <div className="flex items-center justify-center space-x-1.5 text-xs font-mono font-bold text-black">
          <ShieldCheck className="w-4 h-4 text-verifier-700" />
          <span>M.S. Ramaiah University of Applied Sciences</span>
        </div>
        <p className="text-[11px] font-mono text-ink-600">
          Need support with your account or credentials? Contact:{" "}
          <a
            href="mailto:campus.marketplace.ruas@gmail.com"
            className="font-bold text-black underline hover:text-brutal-purple-dark"
          >
            campus.marketplace.ruas@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold text-ink-600">Loading student sign in portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
