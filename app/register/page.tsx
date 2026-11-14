"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ALLOWED_EMAIL_DOMAIN, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { ShieldCheck, Mail, Lock, User, Phone, BookOpen, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();

  // Form Step: 1 = Details & Email; 2 = Enter OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [year, setYear] = useState("1st Year (Freshman)");
  const [course, setCourse] = useState("B.Tech Computer Science");
  const [phone, setPhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");

  // OTP State
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`) && !trimmedEmail.endsWith(`.${ALLOWED_EMAIL_DOMAIN}`)) {
      setError(`Email must end in @${ALLOWED_EMAIL_DOMAIN} (e.g., student.name@msruas.ac.in)`);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code.");
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
      } else {
        setStep(2);
        setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
        setSuccessMsg(`Verification code dispatched to ${trimmedEmail}.`);
      }
    } catch (err: any) {
      setError("Network error while requesting verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    // Auto-cleanse phone number
    let sanitizedPhone = phone.trim();
    const rawDigits = sanitizedPhone.replace(/\D/g, "");
    if (rawDigits.length === 10) {
      sanitizedPhone = `+91 ${rawDigits}`;
    } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
      sanitizedPhone = `+91 ${rawDigits.slice(2)}`;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          otp: otp.trim(),
          password,
          name: name.trim(),
          year,
          course,
          phone: sanitizedPhone,
          personalEmail: personalEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else {
        setSuccessMsg("Account verified! Logging you in...");
        // Automatically sign in user
        await signIn(trimmedEmail, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Verification failed due to a connection issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      {/* ────────────────── NEO-BRUTALIST REGISTRATION CARD ────────────────── */}
      <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal-lg relative overflow-hidden bg-grid-pattern">
        
        {/* Yellow Top-Left Decorative Tab with Interlocking Logo */}
        <div className="absolute top-0 left-0 bg-brutal-yellow border-r-2 border-b-2 border-black rounded-br-2xl px-4 py-2.5 shadow-[2px_2px_0px_#000]">
          <Logo size="sm" withText={false} badgeOnly={true} href="" />
        </div>

        {/* Center Header */}
        <div className="text-center space-y-1.5 pt-6 mb-6">
          <h1 className="font-sans font-black text-3xl text-black tracking-tight">
            {step === 1 ? "Student Registration" : "Enter Verification Code"}
          </h1>
          <p className="text-xs font-semibold text-ink-600">
            {step === 1
              ? `Restricted to verified M.S. Ramaiah University students (@${ALLOWED_EMAIL_DOMAIN}).`
              : `We dispatched a 6-digit cryptographic code to ${email.trim()}.`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-brutal-pink border-2 border-black rounded-2xl text-xs text-black flex items-start space-x-2.5 shadow-[2px_2px_0px_#000]">
            <AlertCircle className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-brutal-mint border-2 border-black rounded-2xl text-xs text-black flex items-start space-x-2.5 shadow-[2px_2px_0px_#000]">
            <CheckCircle2 className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Step 1: User & Student Details */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-sans font-medium text-black placeholder-ink-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                University Email ({ALLOWED_EMAIL_DOMAIN})
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder={`student.roll@${ALLOWED_EMAIL_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-sans font-medium text-black placeholder-ink-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                />
              </div>
              <p className="text-[10px] font-mono font-bold text-ink-600 mt-1">
                Must end in @{ALLOWED_EMAIL_DOMAIN} or @student.{ALLOWED_EMAIL_DOMAIN}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-sm font-sans font-medium text-black placeholder-ink-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-sans font-bold text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                >
                  <option>1st Year (Freshman)</option>
                  <option>2nd Year (Sophomore)</option>
                  <option>3rd Year (Junior)</option>
                  <option>4th Year (Senior)</option>
                  <option>Postgraduate / Master&apos;s</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Course
                </label>
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 text-black absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech CSE"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-sans font-medium text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Phone (Contact)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-black absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-sans font-medium text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                  Personal Email (Backup)
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-sans font-medium text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm tracking-wide rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Domain &amp; Dispatching Code...</span>
                </>
              ) : (
                <>
                  <span>Request Student OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-black uppercase tracking-wider mb-1 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full py-3 px-4 text-center font-mono text-3xl tracking-[0.4em] font-black bg-paper-50 border-2 border-black rounded-xl text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000] transition"
                autoFocus
              />
              <p className="text-[11px] font-mono text-ink-600 mt-2 text-center">
                Dispatched to your student inbox (or dev console locally).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm tracking-wide rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying &amp; Provisioning Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Code &amp; Finish Setup</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs font-sans font-bold pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-black hover:underline"
              >
                &larr; Edit Details
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleRequestOtp}
                className="text-black hover:underline disabled:text-ink-400"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t-2 border-black/10 text-center text-xs text-ink-700 font-medium">
          Already verified?{" "}
          <Link href="/login" className="font-sans font-black text-black underline underline-offset-4 hover:text-brutal-purple-dark">
            Sign in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}
