"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Gamepad2, BookOpen, Laptop, Sparkles } from "lucide-react";

export function ExploreCard() {
  const [activeCategory, setActiveCategory] = useState("Gaming");

  const categories = [
    { label: "All", href: "/browse" },
    { label: "Gaming", href: "/browse?category=Electronics+%26+Calculators" },
    { label: "Books", href: "/browse?category=Books+%26+Notes" },
    { label: "Gear", href: "/browse?category=Lab+%26+Drawing+Equipment" },
  ];

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[360px] group hover:-translate-y-1 transition-transform">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-sans font-black text-xl text-black">Explore Gear</h3>
          <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black animate-pulse" />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setActiveCategory(c.label)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border-2 border-black transition-all ${
                activeCategory === c.label
                  ? "bg-brutal-yellow shadow-[2px_2px_0px_#000] text-black"
                  : "bg-paper-100 hover:bg-paper-200 text-ink-700"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Visual Yellow Hero Card */}
      <div className="my-4 bg-brutal-yellow border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden group/product">
        {/* Product SVG Graphic - Gamepad from Reference Image */}
        <div className="w-28 h-28 flex items-center justify-center transform group-hover/product:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 100" className="w-24 h-24 drop-shadow-[4px_4px_0px_#000000]">
            {/* Gamepad body */}
            <path
              d="M 25 35 Q 50 40 75 35 Q 90 45 85 75 Q 80 85 70 80 L 60 55 L 40 55 L 30 80 Q 20 85 15 75 Q 10 45 25 35 Z"
              fill="#18181B"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* D-Pad */}
            <path d="M 25 45 L 33 45 L 33 40 L 37 40 L 37 45 L 45 45 L 45 49 L 37 49 L 37 54 L 33 54 L 33 49 L 25 49 Z" fill="#4B5563" />
            {/* Buttons */}
            <circle cx="65" cy="43" r="3" fill="#EF4444" />
            <circle cx="73" cy="47" r="3" fill="#3B82F6" />
            <circle cx="65" cy="51" r="3" fill="#10B981" />
            <circle cx="57" cy="47" r="3" fill="#F59E0B" />
            {/* Thumbsticks */}
            <circle cx="36" cy="62" r="5" fill="#374151" stroke="#000000" strokeWidth="1.5" />
            <circle cx="64" cy="62" r="5" fill="#374151" stroke="#000000" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="w-full flex justify-between items-end mt-2">
          <div>
            <h4 className="font-sans font-black text-sm text-black">Game Zone &amp; Tech</h4>
            <p className="text-[11px] font-bold text-ink-800">Play. Chill. Repeat.</p>
          </div>

          <Link
            href="/browse?category=Electronics+%26+Calculators"
            className="w-9 h-9 rounded-full bg-black text-white hover:bg-ink-800 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#FFFFFF] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            aria-label="Explore Gaming"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Mini Nav */}
      <div className="pt-2 border-t border-black/10 flex justify-around text-center text-xs font-mono font-bold text-ink-700">
        <Link href="/" className="hover:text-black">Home</Link>
        <Link href="/browse" className="text-black underline underline-offset-4">Search</Link>
        <Link href="/orders" className="hover:text-black">Orders</Link>
        <Link href="/profile" className="hover:text-black">Profile</Link>
      </div>
    </div>
  );
}

