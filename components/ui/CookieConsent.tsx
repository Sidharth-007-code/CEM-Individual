"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, Shield, Check, X } from "lucide-react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("campus_cookie_consent");
      if (!consent) {
        // Show after a brief delay for smooth appearance
        const timer = setTimeout(() => setShowBanner(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleConsent = (level: "essential" | "declined") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("campus_cookie_consent", level);
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-modern-surface border border-modern-border rounded-xl p-4 sm:p-5 shadow-modern-lg space-y-3">

        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-modern-primary-light border border-modern-primary/30 flex items-center justify-center text-modern-primary flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-modern-text-primary uppercase tracking-wide">
              Campus Privacy & Cookies Notice
            </h4>
            <p className="text-[11px] font-mono text-modern-text-tertiary leading-relaxed">
              We use strictly essential cookies and local tokens for session authentication, security checks, and your preferred marketplace mode. Zero third-party tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-modern-border text-xs">
          <Link
            href="/privacy"
            className="text-[11px] font-mono text-modern-text-tertiary hover:text-modern-primary underline font-semibold"
          >
            Read Policy
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleConsent("declined")}
              className="px-2.5 py-1 text-modern-text-secondary hover:text-modern-primary hover:bg-modern-primary-light font-mono text-xs font-semibold rounded-lg border border-modern-border transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleConsent("essential")}
              className="px-3.5 py-1.5 bg-modern-primary hover:bg-modern-primary-hover text-white font-semibold text-xs rounded-lg shadow-modern-sm hover:shadow-modern-md active:scale-[0.98] transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}