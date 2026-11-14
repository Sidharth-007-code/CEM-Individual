"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, Home, Lock } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 sm:p-10 shadow-brutal-lg flex flex-col items-center text-center relative overflow-hidden bg-grid-pattern">
        
        {/* Yellow Warning Pill */}
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brutal-yellow text-black border-2 border-black rounded-full text-xs font-mono font-black shadow-[2px_2px_0px_#000] mb-2">
          <ShieldAlert className="w-3.5 h-3.5 stroke-[3]" />
          <span>ACCESS RESTRICTED</span>
        </div>

        {/* 403 Big Heading */}
        <h1 className="font-sans font-black text-6xl sm:text-7xl text-black tracking-tight drop-shadow-[3px_3px_0px_#FFD027]">
          403
        </h1>

        <h2 className="font-sans font-black text-2xl text-black mt-2">
          Permission Denied
        </h2>

        <p className="text-xs sm:text-sm font-semibold text-ink-600 mt-2 max-w-xs leading-relaxed">
          You don&apos;t have authorization to access this campus zone. Only verified @msruas.ac.in accounts with appropriate privileges can enter.
        </p>

        {/* Padlock / Shield SVG Illustration */}
        <div className="my-6 relative w-36 h-32 flex items-center justify-center">
          <svg viewBox="0 0 120 110" className="w-full h-full drop-shadow-[3px_3px_0px_#000]">
            {/* Shackle */}
            <path
              d="M 40 45 L 40 30 Q 40 10 60 10 Q 80 10 80 30 L 80 45"
              fill="none"
              stroke="#000000"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Body */}
            <rect x="25" y="45" width="70" height="55" rx="14" fill="#FFD027" stroke="#000000" strokeWidth="2.5" />
            {/* Keyhole */}
            <circle cx="60" cy="68" r="6" fill="#000000" />
            <path d="M 57 71 L 63 71 L 65 85 L 55 85 Z" fill="#000000" />
            {/* Accent Stars */}
            <circle cx="15" cy="30" r="3" fill="#8B5CF6" />
            <circle cx="105" cy="40" r="2.5" fill="#FDA4AF" />
          </svg>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
          <Link
            href="/login"
            className="flex-1 py-2.5 px-4 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Log In with MSRUAS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

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
