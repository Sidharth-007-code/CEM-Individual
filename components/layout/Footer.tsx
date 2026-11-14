"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, MapPin } from "lucide-react";

export function Footer() {
  const { role } = useAuth();

  return (
    <footer className="border-t border-ink-200 bg-paper-100 text-ink-800 text-xs py-8 pb-20 sm:pb-8 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ink-200 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-lg font-black tracking-tight text-ink-950">
                CAMPUS<span className="text-saffron-500 font-sans font-light">MARKET</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-saffron-100 text-saffron-800 font-bold rounded border border-saffron-300">
                MSRUAS VERIFIED
              </span>
            </div>
            <p className="text-ink-600 mt-1 max-w-md text-[11px] leading-relaxed">
              M.S. Ramaiah University of Applied Sciences student-to-student verified marketplace.
              Designed for fair exchange, zero commercial fees, and campus safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono bg-paper-200 text-ink-800 border border-ink-300">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-verifier-700 inline" />
              Verified Student IDs
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-mono bg-paper-200 text-ink-800 border border-ink-300">
              <MapPin className="w-3.5 h-3.5 mr-1 text-saffron-600 inline" />
              CCTV Safe Meetup Spots
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-[11px] text-ink-500 gap-2">
          <p>
            &copy; {new Date().getFullYear()} Campus Marketplace &bull; RUAS Verified Student Community &bull; 10-Min Session Auto-Logout Enabled
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/browse" className="hover:text-ink-900 transition">Notice Board</Link>
            <Link href="/privacy" className="hover:text-ink-900 transition font-medium">Privacy Policy</Link>
            <Link href="/security" className="hover:text-ink-900 transition font-medium">Trust &amp; Security</Link>
            {(role === "verifier" || role === "admin") && (
              <Link href="/verifier" className="text-verifier-700 hover:text-verifier-900 font-medium transition">Verifier Desk</Link>
            )}
            {role === "admin" && (
              <Link href="/admin" className="text-admin-700 hover:text-admin-900 font-medium transition">Admin Console</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
