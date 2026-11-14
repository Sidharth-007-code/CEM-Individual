import React from "react";
import Link from "next/link";
import { BentoGrid } from "@/components/bento/BentoGrid";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";
import { Sparkles, ShieldCheck, MapPin, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-8">
      {/* 1. Full Neo-Brutalist Campus Marketplace Bento Grid & Hero Showcase */}
      <section>
        <BentoGrid />
      </section>

      {/* 2. Safe University Safeguards Strip */}
      <section className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal grid grid-cols-1 sm:grid-cols-3 gap-6 text-black">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brutal-green border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <strong className="block font-sans font-black text-sm">100% Student Verified</strong>
            <span className="text-xs font-semibold text-ink-600">Requires institutional @msruas.ac.in credentials.</span>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-black" />
          </div>
          <div>
            <strong className="block font-sans font-black text-sm">AI Product Validation</strong>
            <span className="text-xs font-semibold text-ink-600">Automated fair price benchmarks and syllabus safety checks.</span>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-brutal-purple-light border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-brutal-purple-dark" />
          </div>
          <div>
            <strong className="block font-sans font-black text-sm">Official CCTV Meetup Zones</strong>
            <span className="text-xs font-semibold text-ink-600">Safe verified handovers at Library, Canteen &amp; Main Gate.</span>
          </div>
        </div>
      </section>

      {/* 3. Main Live Notice Board & Product Showings */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 border-b-2 border-black pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brutal-yellow border border-black text-[10px] font-mono font-bold uppercase mb-1">
              <Sparkles className="w-3 h-3 text-black" />
              <span>Verified Campus Listings</span>
            </div>
            <h2 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Notice Board
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-ink-600 bg-paper-100 border border-black/20 px-3 py-1 rounded-xl">
            Updated in real-time &bull; RUAS Net
          </span>
        </div>

        <BrowseNoticeBoard />
      </section>
    </div>
  );
}
