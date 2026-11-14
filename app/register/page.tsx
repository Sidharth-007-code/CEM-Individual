"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ALLOWED_EMAIL_DOMAIN, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { ShieldCheck, Mail, Lock, User, Phone, BookOpen, AlertCircle, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { user, signIn } = useAuth();

  // Form Step: 1 = Details & Email; 2 = Enter OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [year, setYear] = useState("1st Year");
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

    if (!email.trim().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`) && !email.trim().endsWith(`.${ALLOWED_EMAIL_DOMAIN}`)) {
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
        body: JSON.stringify({ email: email.trim() }),
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
        setSuccessMsg(`Verification code dispatched to ${email.trim()}.`);
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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
          name: name.trim(),
          year,
          course,
          phone: phone.trim(),
          personalEmail: personalEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed.");
      } else {
        setSuccessMsg("Account verified! Logging you in...");
        // Automatically sign in user
        await signIn(email.trim(), password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Verification failed due to a connection issue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      {/* Editorial Card */}
      <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 sm:p-8 shadow-card">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-saffron-100 text-saffron-600 mb-1 border border-saffron-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
            {step === 1 ? "Student Registration" : "Enter Verification Code"}
          </h1>
          <p className="text-xs text-ink-600 leading-relaxed max-w-xs mx-auto">
            {step === 1
              ? `Restricted to verified M.S. Ramaiah University students (@${ALLOWED_EMAIL_DOMAIN}).`
              : `We sent a 6-digit OTP to ${email}. Code valid for 10 minutes.`}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-admin-50 border border-admin-600/40 rounded-notice text-xs text-admin-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-verifier-50 border border-verifier-600/40 rounded-notice text-xs text-verifier-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-verifier-600 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Step 1: User & Student Details */}
        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                University Email ({ALLOWED_EMAIL_DOMAIN})
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder={`student.roll@${ALLOWED_EMAIL_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                />
              </div>
              <p className="text-[10px] text-ink-500 mt-1">
                Must end in @{ALLOWED_EMAIL_DOMAIN} or @student.{ALLOWED_EMAIL_DOMAIN}.
              </p>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-saffron-500 focus:ring-1 focus:ring-saffron-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                >
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                  <option>Postgraduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Course
                </label>
                <div className="relative">
                  <BookOpen className="w-3.5 h-3.5 text-ink-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech CSE"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Phone (for Call link)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-ink-500 absolute left-2.5 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                  Personal Email (Backup)
                </label>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-2.5 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 bg-ink-950 hover:bg-ink-900 text-paper-50 font-serif font-bold text-sm tracking-wide rounded-notice shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Domain & Sending Code...</span>
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
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full py-3 px-4 text-center font-mono text-2xl tracking-[0.4em] font-bold bg-paper-50 border-2 border-ink-300 rounded-notice text-ink-950 focus:outline-none focus:border-saffron-500"
                autoFocus
              />
              <p className="text-[11px] text-ink-600 mt-2 text-center">
                Check your inbox (or terminal dev console if running locally).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-sm tracking-wide rounded-notice shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying & Provisioning...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Code & Finish Setup</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-ink-600 hover:text-ink-950 underline"
              >
                &larr; Edit Details
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || loading}
                onClick={handleRequestOtp}
                className="text-saffron-600 hover:text-saffron-700 font-medium disabled:text-ink-400"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-ink-200 text-center text-xs text-ink-600">
          Already verified?{" "}
          <Link href="/login" className="font-serif font-bold text-ink-900 hover:text-saffron-600 underline">
            Log in to your account
          </Link>
        </div>
      </div>
    </div>
  );
}

