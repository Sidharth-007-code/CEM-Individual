import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 sm:p-10 shadow-brutal-lg flex flex-col items-center text-center relative overflow-hidden bg-grid-pattern">
        
        {/* Purple Nebula Cloud Accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brutal-purple/30 blur-2xl pointer-events-none" />

        {/* 404 Big Heading */}
        <h1 className="font-sans font-black text-6xl sm:text-7xl text-black tracking-tight drop-shadow-[3px_3px_0px_#FFD027]">
          404
        </h1>

        <h2 className="font-sans font-black text-2xl text-black mt-2">
          Page Not Found
        </h2>

        <p className="text-xs sm:text-sm font-semibold text-ink-600 mt-2 max-w-xs leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist, was moved, or entered a different campus orbit.
        </p>

        {/* Astronaut on the Moon Illustration from Reference Visual */}
        <div className="my-6 relative w-40 h-32 flex items-center justify-center">
          <svg viewBox="0 0 160 120" className="w-full h-full drop-shadow-[3px_3px_0px_#000]">
            {/* Moon surface */}
            <path
              d="M 10 115 Q 80 80 150 115 Z"
              fill="#E5E7EB"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Moon craters */}
            <ellipse cx="50" cy="105" rx="10" ry="4" fill="#D1D5DB" stroke="#000000" strokeWidth="1.5" />
            <ellipse cx="110" cy="108" rx="7" ry="3" fill="#D1D5DB" stroke="#000000" strokeWidth="1.5" />

            {/* Astronaut body */}
            <circle cx="80" cy="40" r="16" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
            {/* Visor */}
            <ellipse cx="80" cy="40" rx="10" ry="8" fill="#18181B" stroke="#000000" strokeWidth="2" />
            <ellipse cx="78" cy="38" rx="3" ry="1.5" fill="#60A5FA" />
            {/* Suit */}
            <path
              d="M 68 56 Q 80 52 92 56 L 96 85 Q 80 90 64 85 Z"
              fill="#FFFFFF"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Backpack */}
            <rect x="60" y="52" width="8" height="28" rx="3" fill="#E5E7EB" stroke="#000000" strokeWidth="2" />
            {/* Legs */}
            <path d="M 70 85 L 68 100 L 76 100 L 77 86" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
            <path d="M 83 86 L 84 100 L 92 100 L 90 85" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
            {/* Floating stars */}
            <path d="M 35 25 L 38 30 L 44 32 L 39 36 L 41 42 L 35 38 L 29 42 L 31 36 L 26 32 L 32 30 Z" fill="#FFD027" stroke="#000000" strokeWidth="1" />
            <circle cx="125" cy="28" r="2" fill="#000000" />
            <circle cx="135" cy="45" r="1.5" fill="#8B5CF6" />
          </svg>
        </div>

        {/* Go Home CTA Button */}
        <Link
          href="/"
          className="px-6 py-2.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2"
        >
          <span>Go Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

