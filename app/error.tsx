"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle, ArrowRight } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Campus Marketplace Runtime Error]:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 sm:p-10 shadow-brutal-lg flex flex-col items-center text-center relative overflow-hidden bg-grid-pattern">
        
        {/* Pink Glow Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brutal-pink/30 blur-2xl pointer-events-none" />

        {/* 500 Number Display */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brutal-pink text-black border-2 border-black rounded-full text-xs font-mono font-black shadow-[2px_2px_0px_#000] mb-2">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
          <span>SERVER EXCEPTION</span>
        </div>

        <h1 className="font-sans font-black text-6xl sm:text-7xl text-black tracking-tight drop-shadow-[3px_3px_0px_#FDA4AF]">
          500
        </h1>

        <h2 className="font-sans font-black text-2xl text-black mt-2">
          Something Went Wrong
        </h2>

        <p className="text-xs sm:text-sm font-semibold text-ink-600 mt-2 max-w-xs leading-relaxed">
          An unexpected error interrupted this campus request. Don&apos;t worry, your listings and transactions are safe.
        </p>

        {/* Playful Robot / Sparking Wire SVG Illustration */}
        <div className="my-6 relative w-40 h-32 flex items-center justify-center">
          <svg viewBox="0 0 140 110" className="w-full h-full drop-shadow-[3px_3px_0px_#000]">
            {/* Robot Head */}
            <rect x="35" y="25" width="70" height="55" rx="14" fill="#FFD027" stroke="#000000" strokeWidth="2.5" />
            {/* Antenna */}
            <line x1="70" y1="25" x2="70" y2="12" stroke="#000000" strokeWidth="2.5" />
            <circle cx="70" cy="10" r="4.5" fill="#FDA4AF" stroke="#000000" strokeWidth="2" />
            {/* Eyes - Dizzy X for error */}
            <line x1="50" y1="42" x2="60" y2="52" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="60" y1="42" x2="50" y2="52" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />

            <line x1="80" y1="42" x2="90" y2="52" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="90" y1="42" x2="80" y2="52" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mouth */}
            <path d="M 52 65 Q 70 58 88 65" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
            {/* Sparks */}
            <path d="M 22 25 L 28 32 L 20 38" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
            <path d="M 115 28 L 122 34 L 116 42" fill="none" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round" />
            {/* Neck & Bolts */}
            <rect x="58" y="80" width="24" height="12" fill="#E5E7EB" stroke="#000000" strokeWidth="2" />
            <circle cx="28" cy="52" r="3.5" fill="#9CA3AF" stroke="#000000" strokeWidth="1.5" />
            <circle cx="112" cy="52" r="3.5" fill="#9CA3AF" stroke="#000000" strokeWidth="1.5" />
          </svg>
        </div>

        {error?.digest && (
          <div className="mb-4 px-2.5 py-1 bg-paper-100 border border-black/20 rounded-lg text-[10px] font-mono text-ink-600">
            Error ID: {error.digest}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4 stroke-[2.5]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="py-2.5 px-4 bg-white hover:bg-paper-100 text-black font-sans font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
