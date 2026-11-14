import React from "react";

export function AsteriskSticker({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative inline-block select-none animate-bounce-slow transform hover:rotate-12 transition-transform duration-300 ${className}`}
    >
      {/* 3D Black Offset Shadow */}
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 sm:w-20 sm:h-20 absolute top-1.5 left-1.5 text-black"
        fill="currentColor"
      >
        <path d="M50 0 L60 35 L95 20 L75 50 L95 80 L60 65 L50 100 L40 65 L5 80 L25 50 L5 20 L40 35 Z" />
      </svg>
      {/* Foreground Yellow Star */}
      <svg
        viewBox="0 0 100 100"
        className="w-16 h-16 sm:w-20 sm:h-20 relative text-brutal-yellow"
        fill="currentColor"
        stroke="#000000"
        strokeWidth="4"
        strokeLinejoin="round"
      >
        <path d="M50 0 L60 35 L95 20 L75 50 L95 80 L60 65 L50 100 L40 65 L5 80 L25 50 L5 20 L40 35 Z" />
      </svg>
    </div>
  );
}

