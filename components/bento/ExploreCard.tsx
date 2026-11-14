"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, BookOpen, PenTool, CheckCircle2 } from "lucide-react";

export function ExploreCard() {
  const [activeCategory, setActiveCategory] = useState("Calculators");

  const categories = [
    { label: "All", href: "/browse" },
    { label: "Calculators", href: "/browse?category=Calculators+%26+Electronics" },
    { label: "Textbooks", href: "/browse?category=Textbooks+%26+Notes" },
    { label: "Lab Gear", href: "/browse?category=Lab+Equipment+%26+Uniforms" },
  ];

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[360px] group hover:-translate-y-1 transition-transform">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h3 className="font-sans font-black text-xl text-black">Campus Essentials</h3>
            <span className="px-2 py-0.5 rounded-md bg-brutal-green text-[10px] font-mono font-black border border-black">
              VERIFIED
            </span>
          </div>
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

      {/* Featured Visual Yellow Hero Card: Scientific Calculator / Campus Gear */}
      <div className="my-4 bg-brutal-yellow border-2 border-black rounded-2xl p-4 shadow-[3px_3px_0px_#000] flex flex-col items-center justify-center relative overflow-hidden group/product">
        {/* Visual Badge */}
        <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 rounded-md text-[9px] font-mono font-bold">
          RUAS Syllabus Approved
        </div>

        {/* Scientific Calculator SVG Graphic */}
        <div className="w-28 h-28 flex items-center justify-center transform group-hover/product:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 120" className="w-20 h-24 drop-shadow-[4px_4px_0px_#000000]">
            {/* Calculator Body */}
            <rect x="15" y="10" width="70" height="100" rx="10" fill="#18181B" stroke="#000000" strokeWidth="3" />
            {/* Solar cell strip */}
            <rect x="52" y="18" width="25" height="10" rx="2" fill="#78350F" stroke="#000" strokeWidth="1" />
            {/* Dot Matrix LCD Screen */}
            <rect x="23" y="32" width="54" height="20" rx="3" fill="#A7F3D0" stroke="#000" strokeWidth="2" />
            <text x="27" y="46" fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#064E3B">fx-991CW OK</text>
            {/* Keypad Grid */}
            <rect x="23" y="58" width="10" height="7" rx="1.5" fill="#3B82F6" stroke="#000" strokeWidth="1" />
            <rect x="37" y="58" width="10" height="7" rx="1.5" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <rect x="51" y="58" width="10" height="7" rx="1.5" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <rect x="65" y="58" width="12" height="7" rx="1.5" fill="#EF4444" stroke="#000" strokeWidth="1" />
            {/* Row 2 */}
            <rect x="23" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="37" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="51" y="68" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="65" y="68" width="12" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            {/* Row 3 */}
            <rect x="23" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="37" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="51" y="78" width="10" height="7" rx="1.5" fill="#4B5563" stroke="#000" strokeWidth="1" />
            <rect x="65" y="78" width="12" height="7" rx="1.5" fill="#3B82F6" stroke="#000" strokeWidth="1" />
            {/* Row 4 */}
            <rect x="23" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <rect x="37" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <rect x="51" y="88" width="10" height="8" rx="1.5" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
            <rect x="65" y="88" width="12" height="8" rx="1.5" fill="#10B981" stroke="#000" strokeWidth="1" />
          </svg>
        </div>

        <div className="w-full flex justify-between items-end mt-2">
          <div>
            <h4 className="font-sans font-black text-sm text-black">Casio fx-991CW ClassWiz</h4>
            <p className="text-[11px] font-bold text-ink-800">₹850 &bull; Excellent Condition</p>
          </div>

          <Link
            href="/browse?category=Calculators+%26+Electronics"
            className="w-9 h-9 rounded-full bg-black text-white hover:bg-ink-800 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#FFFFFF] active:translate-x-[1px] active:translate-y-[1px] transition-all"
            aria-label="Explore Calculators"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Bottom Mini Nav */}
      <div className="pt-2 border-t border-black/10 flex justify-around text-center text-xs font-mono font-bold text-ink-700">
        <Link href="/browse" className="hover:text-black">Notice Board</Link>
        <Link href="/listings/new" className="text-black underline underline-offset-4">+ Post Item</Link>
        <Link href="/orders" className="hover:text-black">My Orders</Link>
        <Link href="/profile" className="hover:text-black">Profile</Link>
      </div>
    </div>
  );
}

