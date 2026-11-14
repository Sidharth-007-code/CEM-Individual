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

  const setDemoCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* ────────────────── NEO-BRUTALIST "WELCOME BACK!" CARD ────────────────── */}
      <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-lg relative overflow-hidden bg-grid-pattern">
        
        {/* Yellow Top-Left Decorative Tab with Interlocking Logo (from Reference Visual) */}
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
              Email Address
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
          </div>

          {/* Password Field with Show/Hide Eye Toggle */}
          <div>
            <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
              Password
            </label>
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

        {/* Or Divider from Reference Visual */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/20" />
          </div>
          <div className="relative flex justify-center text-[10px] font-mono font-bold uppercase">
            <span className="bg-white px-3 text-ink-600">or continue with</span>
          </div>
        </div>

        {/* Social Authentication Pills (G, Apple, GitHub from Reference Visual) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDemoCredentials("aarav.sharma@msruas.ac.in", "StudentPass@2024")}
            className="py-2 px-3 border-2 border-black rounded-xl bg-white hover:bg-paper-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center font-black font-sans text-xs text-black"
            title="Google Sign In (Auto-fill Demo)"
          >
            <span className="font-serif text-sm mr-1 text-black font-black">G</span>
            <span className="text-[10px]">Google</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("priya.patel@msruas.ac.in", "StudentPass@2024")}
            className="py-2 px-3 border-2 border-black rounded-xl bg-white hover:bg-paper-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center font-black font-sans text-xs text-black"
            title="Apple Sign In (Auto-fill Demo)"
          >
            <span className="text-sm mr-1"></span>
            <span className="text-[10px]">Apple</span>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("admin@msruas.ac.in", "CampusAdmin@2024")}
            className="py-2 px-3 border-2 border-black rounded-xl bg-white hover:bg-paper-100 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center font-black font-sans text-xs text-black"
            title="GitHub Sign In (Auto-fill Admin)"
          >
            <span className="font-mono text-sm mr-1 font-bold">⌘</span>
            <span className="text-[10px]">GitHub</span>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t-2 border-black/10 text-center text-xs text-ink-700 font-medium">
          First time on Campus Marketplace?{" "}
          <Link href="/register" className="font-sans font-black text-black underline underline-offset-4 hover:text-brutal-purple-dark">
            Verify student email &amp; register
          </Link>
        </div>
      </div>

      {/* ────────────────── DEMO CREDENTIALS QUICK SWITCHER ────────────────── */}
      <div className="p-5 bg-white border-2 border-black rounded-3xl shadow-brutal space-y-3">
        <div className="flex items-center justify-between border-b border-black/10 pb-2">
          <span className="text-xs font-mono font-black text-black uppercase tracking-wider flex items-center">
            <span className="w-2.5 h-2.5 rounded-full bg-brutal-yellow border border-black mr-2 animate-pulse" />
            Quick Demo Accounts (1-Click Fill)
          </span>
          <span className="text-[10px] font-mono font-bold text-ink-600 bg-paper-100 px-2 py-0.5 rounded border border-black/20">
            RUAS Net
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => setDemoCredentials("aarav.sharma@msruas.ac.in", "StudentPass@2024")}
            className="p-2.5 text-left bg-white hover:bg-brutal-yellow/20 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            <div className="font-black text-black">Student (Seller)</div>
            <div className="text-[11px] font-mono text-ink-600 truncate">aarav.sharma@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("priya.patel@msruas.ac.in", "StudentPass@2024")}
            className="p-2.5 text-left bg-white hover:bg-brutal-yellow/20 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            <div className="font-black text-black">Student (Buyer)</div>
            <div className="text-[11px] font-mono text-ink-600 truncate">priya.patel@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("verifier@msruas.ac.in", "CampusVerifier@2024")}
            className="p-2.5 text-left bg-verifier-50 hover:bg-verifier-100 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            <div className="font-black text-verifier-900">Verifier Desk</div>
            <div className="text-[11px] font-mono text-verifier-700 truncate">verifier@msruas.ac.in</div>
          </button>

          <button
            type="button"
            onClick={() => setDemoCredentials("admin@msruas.ac.in", "CampusAdmin@2024")}
            className="p-2.5 text-left bg-admin-50 hover:bg-admin-100 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition"
          >
            <div className="font-black text-admin-900">Administrator</div>
            <div className="text-[11px] font-mono text-admin-700 truncate">admin@msruas.ac.in</div>
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
          <div className="w-8 h-8 border-3 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold text-ink-600">Loading student sign in portal...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
