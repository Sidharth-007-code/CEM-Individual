"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { AsteriskSticker } from "./AsteriskSticker";
import { WeatherWidget } from "./WeatherWidget";
import { MusicWidget } from "./MusicWidget";
import { CalendarWidget } from "./CalendarWidget";
import { TasksWidget } from "./TasksWidget";
import { StatsWidget } from "./StatsWidget";
import { SkillsWidget } from "./SkillsWidget";
import { AppSwitcherWidget } from "./AppSwitcherWidget";
import { UserProfileCard } from "./UserProfileCard";
import { PlansWidget } from "./PlansWidget";
import { ExploreCard } from "./ExploreCard";
import { BrutalToast } from "@/components/ui/BrutalToast";

export function BentoGrid() {
  const [showSuccessToast, setShowSuccessToast] = useState(true);
  const [showAttentionToast, setShowAttentionToast] = useState(true);
  const [showInfoToast, setShowInfoToast] = useState(true);

  return (
    <div className="space-y-6">
      {/* ────────────────── SECTION 1: TOP HERO BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Main Hero Card (Matches Top Left "Work Smarter. Loop Better.") */}
        <div className="lg:col-span-7 bg-white border-2 border-black rounded-3xl p-6 sm:p-10 shadow-brutal flex flex-col justify-between relative overflow-hidden bg-grid-pattern min-h-[380px] group">
          {/* Top Pill & Nav */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brutal-yellow border-2 border-black rounded-full shadow-[2px_2px_0px_#000] text-xs font-mono font-black text-black">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              <span>MSRUAS CAMPUS ENGINE</span>
            </div>

            <div className="hidden sm:flex items-center space-x-3 text-xs font-mono font-bold text-ink-700">
              <Link href="/browse" className="hover:text-black hover:underline">Notice Board</Link>
              <Link href="/verifier" className="hover:text-black hover:underline">Verified Spots</Link>
              <Link href="/security" className="hover:text-black hover:underline">Zero Fees</Link>
            </div>
          </div>

          {/* Bold Display Headline with 3D Asterisk */}
          <div className="my-6 relative">
            <div className="flex items-start justify-between">
              <div className="space-y-2 max-w-lg">
                <h1 className="font-sans font-black text-4xl sm:text-6xl text-black tracking-tight leading-[1.08]">
                  Work Smarter.<br />
                  <span className="text-brutal-purple-dark underline decoration-brutal-yellow decoration-wavy decoration-2">
                    Loop Better.
                  </span>
                </h1>
                <p className="text-sm sm:text-base font-semibold text-ink-700 pt-2 max-w-md leading-relaxed">
                  The all-in-one verified platform for university students, creators, and builders.
                  Zero commercial fees, guaranteed safety, and instant peer handovers.
                </p>
              </div>

              {/* 3D Asterisk Sticker on Top Right */}
              <div className="hidden sm:block absolute right-2 top-0">
                <AsteriskSticker />
              </div>
            </div>
          </div>

          {/* CTA Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/browse"
              className="px-6 py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-sm rounded-2xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2"
            >
              <span>Start Free Exchange</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/listings/new"
              className="px-6 py-3 bg-white hover:bg-paper-100 text-black font-sans font-black text-sm rounded-2xl border-2 border-black shadow-brutal hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2"
            >
              <span>+ Post Your Item</span>
              <ArrowDown className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Explore Gear Card (Matches Top Right "Explore" from Visual) */}
        <div className="lg:col-span-5">
          <ExploreCard />
        </div>
      </div>

      {/* ────────────────── SECTION 2: MIDDLE BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Skills Card (2 cols on desktop) */}
        <div className="lg:col-span-4">
          <SkillsWidget />
        </div>

        {/* Music Player Bento (Stargazing) */}
        <div className="lg:col-span-3">
          <MusicWidget />
        </div>

        {/* Weather Bento (Bengaluru 24°C) */}
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>

        {/* Academic Calendar Bento */}
        <div className="lg:col-span-3">
          <CalendarWidget />
        </div>
      </div>

      {/* ────────────────── SECTION 3: LOWER BENTO ROW ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Tasks Checklist Bento */}
        <div className="lg:col-span-3">
          <TasksWidget />
        </div>

        {/* Live Marketplace Pulse / Stats Widget */}
        <div className="lg:col-span-3">
          <StatsWidget />
        </div>

        {/* Quick App Switcher Widget */}
        <div className="lg:col-span-3">
          <AppSwitcherWidget />
        </div>

        {/* Shreyas Adiga Profile Card */}
        <div className="lg:col-span-3">
          <UserProfileCard />
        </div>
      </div>

      {/* ────────────────── SECTION 4: PLANS & ALERTS ROW ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* 3-Tier Pricing Plans (Choose Your Plan) */}
        <div className="lg:col-span-8">
          <PlansWidget />
        </div>

        {/* Interactive Toasts Stack from Reference Image */}
        <div className="lg:col-span-4 space-y-3.5 pt-1">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-ink-600 px-1">
            <span>LIVE STATUS ALERTS</span>
            <span className="w-2 h-2 rounded-full bg-brutal-green" />
          </div>

          {showSuccessToast && (
            <BrutalToast
              type="success"
              title="Success!"
              message="Your peer meetup booking was confirmed."
              onClose={() => setShowSuccessToast(false)}
            />
          )}

          {showAttentionToast && (
            <BrutalToast
              type="warning"
              title="Attention!"
              message="Please verify your university student email."
              onClose={() => setShowAttentionToast(false)}
            />
          )}

          {showInfoToast && (
            <BrutalToast
              type="info"
              title="Info"
              message="AI Product Validation Engine updated to v2.4."
              onClose={() => setShowInfoToast(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

