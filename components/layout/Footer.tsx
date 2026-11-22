"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { ShieldCheck, MapPin, Mail } from "lucide-react";

export function Footer() {
  const { role } = useAuth();

  return (
    <footer className="border-t border-modern-border bg-modern-surface text-modern-text-primary text-xs py-10 pb-24 sm:pb-10 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-modern-border/50 pb-6">
          <div className="space-y-2">
            <Logo size="md" href="/" />
            <p className="text-modern-text-tertiary max-w-md text-xs leading-relaxed font-medium">
              M.S. Ramaiah University of Applied Sciences student-to-student verified marketplace.
              Designed for fair exchange, zero commercial fees, and campus safety.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-modern-verifier-light text-modern-verifier border border-modern-verifier/30">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
              Verified Student IDs
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-modern-warm-light text-modern-warm-text border border-modern-warm/30">
              <MapPin className="w-3.5 h-3.5 mr-1 inline" />
              CCTV Safe Meetup Spots
            </span>
            <a
              href="mailto:campus.marketplace.ruas@gmail.com"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-modern-surface hover:bg-modern-surface-hover text-modern-text-primary border border-modern-border hover:border-modern-primary transition-colors"
              title="Official Campus Support Email"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5 inline" />
              <span>campus.marketplace.ruas@gmail.com</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-mono font-semibold text-modern-text-tertiary gap-3">
          <p className="flex items-center space-x-1.5 flex-wrap">
            <span>&copy; {new Date().getFullYear()} Campus Marketplace</span>
            <span>&bull;</span>
            <span>M.S. Ramaiah University of Applied Sciences</span>
            <span>&bull;</span>
            <span className="text-modern-text-primary font-semibold">Student-to-Student Verified Portal</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 items-center">
            <Link href="/browse" className="text-modern-text-secondary hover:text-modern-primary hover:underline">Notice Board</Link>
            <Link href="/privacy" className="text-modern-text-secondary hover:text-modern-primary hover:underline">Privacy Policy</Link>
            <Link href="/security" className="text-modern-text-secondary hover:text-modern-primary hover:underline">Trust &amp; Security</Link>
            <a href="mailto:campus.marketplace.ruas@gmail.com" className="text-modern-text-secondary hover:text-modern-primary hover:underline inline-flex items-center space-x-1">
              <Mail className="w-3 h-3" />
              <span>Contact: campus.marketplace.ruas@gmail.com</span>
            </a>
            {(role === "verifier" || role === "admin") && (
              <Link href="/verifier" className="text-modern-verifier hover:text-modern-verifier hover:underline">Verifier Desk</Link>
            )}
            {role === "admin" && (
              <Link href="/admin" className="text-modern-admin hover:text-modern-admin hover:underline">Admin Console</Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
