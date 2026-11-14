import React from "react";
import Link from "next/link";
import { ArrowRight, Laptop } from "lucide-react";

export function SkillsWidget() {
  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 sm:p-6 shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[170px] relative overflow-hidden group hover:-translate-y-1 transition-transform">
      {/* Decorative Coral Pink Badge Corner */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-brutal-pink/40 border-2 border-black/20 flex items-center justify-center p-3 relative shrink-0">
        <div className="w-16 h-16 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center">
          <Laptop className="w-9 h-9 text-black" />
        </div>
        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brutal-pink border border-black animate-ping" />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <span className="inline-block px-2 py-0.5 bg-brutal-pink/30 text-brutal-pink-dark border border-black/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
          Student Academic Hub
        </span>
        <h3 className="font-sans font-black text-lg sm:text-xl text-black tracking-tight leading-snug">
          Level Up Your Skills
        </h3>
        <p className="text-xs font-semibold text-ink-600 max-w-xs leading-relaxed">
          Learn, Build and Grow with verified senior lecture notes, syllabus packs &amp; gear.
        </p>
        <div className="pt-1">
          <Link
            href="/browse?category=Books+%26+Notes"
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-brutal-pink hover:bg-brutal-pink-dark text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <span>Explore Course Notes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

