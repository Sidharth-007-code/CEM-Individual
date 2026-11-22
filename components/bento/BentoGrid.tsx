"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AsteriskSticker } from "./AsteriskSticker";
import { WeatherWidget } from "./WeatherWidget";
import { CalendarWidget } from "./CalendarWidget";
import { StatsWidget } from "./StatsWidget";
import { AppSwitcherWidget } from "./AppSwitcherWidget";
import { UserProfileCard } from "./UserProfileCard";
import { ExploreCard } from "./ExploreCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function BentoGrid() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* ────────────────── SECTION 1: TOP HERO BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Main Hero Card - Modern Campus Marketplace Identity */}
        <Card variant="elevated" padding="lg" className="lg:col-span-7 min-h-[380px] flex flex-col justify-between relative overflow-hidden group">
          {/* Top Badge & Nav */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <Badge variant="primary" size="sm" className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>MSRUAS Campus Marketplace &bull; 100% Student Verified</span>
            </Badge>

            <nav className="hidden sm:flex items-center space-x-4 text-sm font-medium text-modern-text-tertiary" aria-label="Quick links">
              <Link href="/browse" className="hover:text-modern-primary transition-colors">Notice Board</Link>
              <Link href="/verifier" className="hover:text-modern-primary transition-colors">CCTV Spots</Link>
              <Link href="/security" className="hover:text-modern-primary transition-colors">Zero Fees</Link>
            </nav>
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center max-w-2xl">
            <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-modern-text-primary tracking-tight leading-[1.1]">
              Exchange Smarter.
              <br />
              <span className="text-modern-primary underline decoration-modern-primary/30 decoration-wavy decoration-2">
                Trade Safer.
              </span>
            </h1>
            <p className="text-base sm:text-lg font-medium text-modern-text-secondary mt-4 max-w-xl leading-relaxed">
              The verified student-to-student marketplace for M.S. Ramaiah University of Applied Sciences.
              Zero commercial fees, guaranteed safety at campus CCTV spots, and instant peer handovers.
            </p>
          </div>

          {/* CTA Buttons Row */}
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-modern-border/50">
            <LinkButton href="/browse" variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}>
              Browse Notice Board
            </LinkButton>

            <LinkButton href="/listings/new" variant="outline" size="lg" rightIcon={<ArrowDown className="w-5 h-5" aria-hidden="true" />}>
              + Post Your Item
            </LinkButton>
          </div>

          {/* Subtle decorative element - bottom right */}
          <div className="absolute bottom-4 right-4 hidden lg:block opacity-10">
            <AsteriskSticker className="transform hover:rotate-0 transition-transform duration-500" />
          </div>
        </Card>

        {/* Explore Gear Card */}
        <div className="lg:col-span-5">
          <ExploreCard />
        </div>
      </div>

      {/* ────────────────── SECTION 2: MIDDLE BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        {/* Marketplace Pulse / Stats Widget */}
        <div className={user ? "lg:col-span-4" : "lg:col-span-6"}>
          <StatsWidget />
        </div>

        {/* Weather Widget */}
        <div className={user ? "lg:col-span-4" : "lg:col-span-6"}>
          <WeatherWidget />
        </div>

        {/* Verified Student Profile Card - STRICTLY visible ONLY to the logged-in user with their name! */}
        {user && (
          <div className="lg:col-span-4">
            <UserProfileCard />
          </div>
        )}
      </div>

      {/* ────────────────── SECTION 3: LOWER BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
        {/* Quick App Switcher Widget */}
        <div className="lg:col-span-6">
          <AppSwitcherWidget />
        </div>

        {/* Academic Calendar Widget */}
        <div className="lg:col-span-6">
          <CalendarWidget />
        </div>
      </div>
    </div>
  );
}