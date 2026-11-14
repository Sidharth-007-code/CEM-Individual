import React from "react";
import Link from "next/link";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";
import { ShieldCheck, BookOpen, Clock, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8">
      
      {/* Editorial Notice-Board Masthead */}
      <section className="relative overflow-hidden bg-paper-100 border border-ink-200 rounded-notice p-6 sm:p-10 shadow-card">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-saffron-100 text-saffron-800 rounded-full border border-saffron-300 text-xs font-serif font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
            <span>M.S. RAMAIAH UNIVERSITY OF APPLIED SCIENCES</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-ink-950 tracking-tight leading-[1.15]">
            The Verified Student Buy &amp; Sell Notice Board.
          </h1>

          <p className="text-sm sm:text-base text-ink-700 font-sans leading-relaxed">
            Direct peer-to-peer textbook exchanges, calculators, and hostel essentials.
            Pre-moderated by campus verifiers, zero middleman fees, and official safe meetup zones.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/browse"
              className="px-5 py-2.5 bg-ink-950 hover:bg-ink-900 text-paper-50 font-serif font-bold text-xs sm:text-sm rounded-notice shadow-sm transition flex items-center space-x-2"
            >
              <span>Explore Notice Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/listings/new"
              className="px-5 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white font-serif font-bold text-xs sm:text-sm rounded-notice shadow-sm transition"
            >
              + Sell an Item
            </Link>
          </div>
        </div>

        {/* Safe Campus Safeguards Badges */}
        <div className="mt-8 pt-6 border-t border-ink-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-ink-700">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-verifier-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-serif font-bold text-ink-950">100% Student Verified</strong>
              <span>Requires institutional @msruas.ac.in credentials.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <BookOpen className="w-5 h-5 text-saffron-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-serif font-bold text-ink-950">Pre-Approved Listings</strong>
              <span>Checked for reasonable price caps and image clarity.</span>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <Clock className="w-5 h-5 text-ink-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-serif font-bold text-ink-950">Designated Meetup Spots</strong>
              <span>Safe exchanges at Campus Library, Canteen &amp; Main Gate.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Notice Board Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-baseline">
          <h2 className="font-serif text-2xl font-black text-ink-950 tracking-tight">
            Active Campus Postings
          </h2>
          <span className="text-xs text-ink-500 font-mono">
            Updated in real-time
          </span>
        </div>

        <BrowseNoticeBoard />
      </section>
    </div>
  );
}

