"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ALLOWED_EMAIL_DOMAIN, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { ShieldCheck, Mail, Lock, User, Phone, BookOpen, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button, Card, Input } from "@/components/ui";

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

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (password.length < 8 || !hasLetter || !hasDigit) {
      setError("Password must be at least 8 characters and contain at least one letter and one number.");
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
      <Card variant="elevated" padding="lg" className="relative overflow-hidden">

        {/* Center Header */}
        <div className="text-center space-y-3 mb-6">
          <Logo size="md" className="justify-center" />
          <h1 className="font-sans font-semibold text-2xl sm:text-3xl text-modern-text-primary tracking-tight">
            {step === 1 ? "Student Registration" : "Enter Verification Code"}
          </h1>
          <p className="text-xs font-semibold text-modern-text-tertiary">
            {step === 1
              ? `Restricted to verified M.S. Ramaiah University students (@${ALLOWED_EMAIL_DOMAIN}).`
              : `We dispatched a 6-digit cryptographic code to ${email.trim()}.`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div role="alert" className="mb-5 p-3.5 bg-modern-error-light border border-modern-error/20 rounded-2xl text-xs text-modern-text-primary flex items-start space-x-2.5 shadow-modern-sm">
            <AlertCircle className="w-4 h-4 text-modern-error flex-shrink-0 mt-0.5" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div role="status" className="mb-5 p-3.5 bg-modern-success-light border border-modern-success/20 rounded-2xl text-xs text-modern-text-primary flex items-start space-x-2.5 shadow-modern-sm">
            <CheckCircle2 className="w-4 h-4 text-modern-success flex-shrink-0 mt-0.5" />
            <span className="font-bold">{successMsg}</span>
          </div>
        )}

        {/* Step 1: User & Student Details */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-modern-text-primary absolute left-3.5 top-3.5" />
                <Input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-sans font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                University Email ({ALLOWED_EMAIL_DOMAIN})
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-modern-text-primary absolute left-3.5 top-3.5" />
                <Input
                  type="email"
                  required
                  placeholder={`student.roll@${ALLOWED_EMAIL_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-sans font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                />
              </div>
              <p className="text-[10px] font-mono font-bold text-modern-text-tertiary mt-1">
                Must end in @{ALLOWED_EMAIL_DOMAIN} or @student.{ALLOWED_EMAIL_DOMAIN}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-modern-text-primary absolute left-3.5 top-3.5" />
                <Input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-sm font-sans font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-sans font-bold text-modern-text-primary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                >
                  <option>1st Year (Freshman)</option>
                  <option>2nd Year (Sophomore)</option>
                  <option>3rd Year (Junior)</option>
                  <option>4th Year (Senior)</option>
                  <option>Postgraduate / Master&apos;s</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                  Course
                </label>
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 text-modern-text-primary absolute left-3 top-3.5" />
                  <Input
                    type="text"
                    required
                    placeholder="e.g. B.Tech CSE"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-sans font-medium text-modern-text-primary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                  Phone (Contact)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-modern-text-primary absolute left-3 top-3.5" />
                  <Input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-2 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-sans font-medium text-modern-text-primary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1">
                  Personal Email (Backup)
                </label>
                <Input
                  type="email"
                  placeholder="name@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-modern-surface-hover border border-modern-border rounded-xl text-xs font-sans font-medium text-modern-text-primary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              className="mt-4 py-3"
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
            </Button>
          </form>
        ) : (
          /* Step 2: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-modern-text-primary uppercase tracking-wider mb-1 text-center">
                6-Digit Verification Code
              </label>
              <Input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full py-3 px-4 text-center font-mono text-3xl tracking-[0.4em] font-semibold bg-modern-surface-hover border border-modern-border rounded-xl text-modern-text-primary focus:outline-none focus:bg-white focus:shadow-modern-sm transition"
                autoFocus
              />
              <p className="text-[11px] font-mono text-modern-text-tertiary mt-2 text-center">
                Dispatched to your student inbox (or dev console locally).
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length !== 6}
              fullWidth
              className="py-3"
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
            </Button>

            <div className="flex items-center justify-between text-xs font-sans font-bold pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-modern-text-primary hover:underline"
              >
                &larr; Edit Details
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleRequestOtp}
                className="text-modern-text-primary hover:underline disabled:text-modern-text-tertiary"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-modern-border/70 text-center text-xs text-modern-text-secondary font-medium">
          Already verified?{" "}
          <Link href="/login" className="font-sans font-semibold text-modern-text-primary underline underline-offset-4 hover:text-modern-primary">
            Sign in to your account
          </Link>
        </div>
      </Card>
    </div>
  );
}
