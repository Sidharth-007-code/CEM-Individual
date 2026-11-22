"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, AlertCircle, RefreshCw, Eye, EyeOff, Clock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button, Card, Input } from "@/components/ui";

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
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">

        {/* Center Header */}
        <div className="text-center space-y-3 mb-6">
          <Logo size="md" className="justify-center" />
          <h1 className="font-sans font-semibold text-3xl text-modern-text-primary tracking-tight">
            Welcome Back!
          </h1>
          <p className="text-xs font-semibold text-modern-text-tertiary">
            Sign in to continue to Campus Marketplace
          </p>
        </div>

        {sessionExpired && !error && (
          <div className="mb-5 p-3.5 bg-modern-warning-light border border-modern-border rounded-2xl text-xs text-modern-text-primary flex items-start space-x-2.5 shadow-modern-sm">
            <Clock className="w-4 h-4 text-modern-warning flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-sans font-semibold">Session Timed Out</strong>
              <span className="font-medium">You were automatically logged out after 10 minutes of inactivity for your security.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-modern-error-light border border-modern-border rounded-2xl text-xs text-modern-text-primary flex items-start space-x-2.5 shadow-modern-sm">
            <AlertCircle className="w-4 h-4 text-modern-error flex-shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field with Neo-brutalist border */}
          <div>
            <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
              University Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-modern-text-primary absolute left-3.5 top-3.5" />
              <Input
                type="email"
                required
                placeholder="name@msruas.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-sans font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
              />
            </div>
            <p className="text-[11px] font-mono text-modern-text-tertiary mt-1">
              Restricted to verified @msruas.ac.in credentials.
            </p>
          </div>

          {/* Password Field with Show/Hide Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-modern-text-primary absolute left-3.5 top-3.5" />
              <Input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-sans font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-modern-text-primary hover:opacity-75 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Yellow Sign In Button with Hard Shadow */}
          <Button
            type="submit"
            disabled={loading}
            fullWidth
            className="py-3"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-modern-border/70 text-center text-xs text-modern-text-secondary font-medium">
          First time on Campus Marketplace?{" "}
          <Link href="/register" className="font-sans font-semibold text-modern-text-primary underline underline-offset-4 hover:text-modern-primary">
            Verify student email &amp; register
          </Link>
        </div>
      </Card>

      {/* Institutional Security Notice & Help Desk */}
      <Card variant="outlined" padding="sm" className="text-center space-y-1.5">
        <div className="flex items-center justify-center space-x-1.5 text-xs font-mono font-bold text-modern-text-primary">
          <ShieldCheck className="w-4 h-4 text-modern-success" />
          <span>M.S. Ramaiah University of Applied Sciences</span>
        </div>
        <p className="text-[11px] font-mono text-modern-text-tertiary">
          Need support with your account or credentials? Contact:{" "}
          <a
            href="mailto:campus.marketplace.ruas@gmail.com"
            className="font-bold text-modern-text-primary underline hover:text-modern-primary"
          >
            campus.marketplace.ruas@gmail.com
          </a>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" aria-hidden="true" />
          <p className="text-xs font-mono font-bold text-modern-text-tertiary">Loading student sign in portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
