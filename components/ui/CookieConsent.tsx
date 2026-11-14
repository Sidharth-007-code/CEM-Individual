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
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-paper-100 border border-ink-300 rounded-notice p-4 shadow-float space-y-3">
        
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-saffron-100 border border-saffron-300 flex items-center justify-center text-saffron-700 flex-shrink-0 mt-0.5">
            <Cookie className="w-4 h-4" />
          </div>

          <div className="space-y-1">
            <h4 className="font-serif font-bold text-xs text-ink-950 uppercase tracking-wide">
              Campus Privacy &amp; Cookies Notice
            </h4>
            <p className="text-[11px] text-ink-700 leading-relaxed">
              We use strictly essential cookies and local tokens for session authentication, security checks, and your preferred marketplace mode. We do not run third-party advertising or commercial tracking cookies.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-ink-200 text-xs">
          <Link
            href="/privacy"
            className="text-[11px] text-ink-600 hover:text-ink-950 underline font-medium"
          >
            Read Privacy Policy
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleConsent("declined")}
              className="px-2.5 py-1 text-ink-600 hover:text-ink-900 text-[11px] rounded transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleConsent("essential")}
              className="px-3 py-1 bg-ink-950 hover:bg-ink-900 text-paper-50 font-serif font-bold text-[11px] rounded-notice shadow-sm transition flex items-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Accept Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

