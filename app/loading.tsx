import React from "react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
      {/* Neo-brutalist Spinning Badge */}
      <div className="w-14 h-14 rounded-2xl bg-brutal-yellow border-2 border-black shadow-brutal flex items-center justify-center animate-bounce">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7 text-black transform rotate-[-45deg]"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      <div className="text-center space-y-1">
        <p className="font-sans font-black text-sm text-black">
          Loading Campus Marketplace...
        </p>
        <span className="text-xs font-mono font-bold text-ink-600 block">
          MSRUAS Verified Peer Network
        </span>
      </div>
    </div>
  );
}

