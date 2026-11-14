import React from "react";
import Link from "next/link";
import { MockBadge } from "@/components/ui/MockBadge";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-paper-100 text-ink-800 text-xs py-8 pb-20 sm:pb-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ink-200 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-black tracking-tight text-ink-950">
                CAMPUS<span className="text-saffron-500 font-sans font-light">MARKET</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-paper-200 text-ink-700 rounded border border-ink-300">
                CSC203B Project
              </span>
            </div>
            <p className="text-ink-600 mt-1 max-w-md text-[11px] leading-relaxed">
              M.S. Ramaiah University of Applied Sciences student-to-student verified marketplace.
              Designed for fair exchange, zero commercial fees, and campus safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MockBadge label="Mocked UPI Simulator" />
            <MockBadge label="Mocked Advisory Linter" />
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-paper-200 text-ink-700 border border-ink-300">
              Firebase Spark Plan
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-ink-500 gap-2">
          <p>
            &copy; {new Date().getFullYear()} Campus Marketplace &bull; Academic Assignment Submission for CSC203B &bull; 10-Min Session Auto-Logout Enabled
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/browse" className="hover:text-ink-900 transition">Notice Board</Link>
            <Link href="/privacy" className="hover:text-ink-900 transition font-medium">Privacy Policy</Link>
            <Link href="/security" className="hover:text-ink-900 transition font-medium">Trust &amp; Security</Link>
            <Link href="/verifier" className="hover:text-ink-900 transition">Verifier Desk</Link>
            <Link href="/admin" className="hover:text-ink-900 transition">Admin Console</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

