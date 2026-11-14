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
      <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-5 shadow-brutal space-y-3">
        
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center text-black flex-shrink-0 mt-0.5 shadow-[1.5px_1.5px_0px_#000]">
            <Cookie className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h4 className="font-sans font-black text-xs text-black uppercase tracking-wide">
              Campus Privacy &amp; Cookies Notice
            </h4>
            <p className="text-[11px] font-mono text-ink-700 leading-relaxed">
              We use strictly essential cookies and local tokens for session authentication, security checks, and your preferred marketplace mode. Zero third-party tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-black/10 text-xs">
          <Link
            href="/privacy"
            className="text-[11px] font-mono text-ink-600 hover:text-black underline font-bold"
          >
            Read Policy
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleConsent("declined")}
              className="px-2.5 py-1 text-black hover:bg-paper-100 font-mono text-xs font-bold rounded-lg border border-black transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => handleConsent("essential")}
              className="px-3.5 py-1.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Accept Cookies</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

