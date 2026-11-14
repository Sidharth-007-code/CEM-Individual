"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { ShieldCheck, MapPin, Heart } from "lucide-react";

export function Footer() {
  const { role } = useAuth();

  return (
    <footer className="border-t-2 border-black bg-white text-black text-xs py-10 pb-24 sm:pb-10 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-black/10 pb-6">
          <div className="space-y-2">
            <Logo size="md" href="/" />
            <p className="text-ink-700 max-w-md text-xs leading-relaxed font-medium">
              M.S. Ramaiah University of Applied Sciences student-to-student verified marketplace.
              Designed for fair exchange, zero commercial fees, and campus safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-brutal-green text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-black inline stroke-[2.5]" />
              Verified Student IDs
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-brutal-yellow text-black border-2 border-black shadow-[2px_2px_0px_#000]">
              <MapPin className="w-3.5 h-3.5 mr-1 text-black inline stroke-[2.5]" />
              CCTV Safe Meetup Spots
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-mono font-bold text-ink-600 gap-3">
          <p className="flex items-center space-x-1.5 flex-wrap">
            <span>&copy; {new Date().getFullYear()} Campus Marketplace</span>
            <span>&bull;</span>
            <span>M.S. Ramaiah University of Applied Sciences</span>
            <span>&bull;</span>
            <span className="text-black font-semibold">Student-to-Student Verified Portal</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Link href="/browse" className="text-black hover:underline">Notice Board</Link>
            <Link href="/privacy" className="text-black hover:underline">Privacy Policy</Link>
            <Link href="/security" className="text-black hover:underline">Trust &amp; Security</Link>
            {(role === "verifier" || role === "admin") && (
              <Link href="/verifier" className="text-verifier-800 hover:underline">Verifier Desk</Link>
            )}
            {role === "admin" && (
              <Link href="/admin" className="text-admin-800 hover:underline">Admin Console</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
