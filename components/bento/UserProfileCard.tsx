"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { MoreHorizontal, User, Sparkles } from "lucide-react";

export function UserProfileCard() {
  const { user, profile } = useAuth();

  // If user is logged in, show their data; otherwise showcase the exact "Shreyas Adiga" card from the reference image!
  const displayName = profile?.name || user?.displayName || "Shreyas Adiga";
  const displayHandle = profile?.email
    ? `@${profile.email.split("@")[0]}`
    : "@shreyas_25";

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col items-center justify-between text-center h-full min-h-[170px] relative group hover:-translate-y-1 transition-transform">
      <div className="w-full flex justify-between items-center text-xs font-mono font-bold text-ink-600">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-brutal-yellow" />
          <span>Verified Student</span>
        </span>
        <button
          type="button"
          className="p-1 hover:bg-paper-200 rounded border border-transparent hover:border-black transition"
          aria-label="Options"
        >
          <MoreHorizontal className="w-4 h-4 text-ink-800" />
        </button>
      </div>

      {/* Avatar Container with Green Online Badge */}
      <div className="relative my-2">
        <div className="w-16 h-16 rounded-full bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center overflow-hidden">
          {profile?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photoURL}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            // Illustrated boy avatar from reference visual
            <svg viewBox="0 0 80 80" className="w-14 h-14 translate-y-1">
              <ellipse cx="40" cy="45" rx="22" ry="24" fill="#FFD0A8" stroke="#000000" strokeWidth="2.5" />
              {/* Hair */}
              <path
                d="M 20 40 Q 22 20 40 18 Q 58 20 60 40 Q 55 25 40 25 Q 25 25 20 40 Z"
                fill="#18181B"
                stroke="#000000"
                strokeWidth="2"
              />
              {/* Eyes */}
              <circle cx="33" cy="42" r="2.5" fill="#000000" />
              <circle cx="47" cy="42" r="2.5" fill="#000000" />
              {/* Smile */}
              <path d="M 36 52 Q 40 56 44 52" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
              {/* Shirt */}
              <path d="M 22 68 Q 40 60 58 68 L 62 80 L 18 80 Z" fill="#18181B" stroke="#000000" strokeWidth="2.5" />
            </svg>
          )}
        </div>
        <div
          className="w-4 h-4 rounded-full bg-brutal-green border-2 border-black absolute bottom-0 right-0 shadow-[1px_1px_0px_#000]"
          title="Online"
        />
      </div>

      {/* Name and Handle */}
      <div className="space-y-0.5">
        <h4 className="font-sans font-black text-base text-black tracking-tight">
          {displayName}
        </h4>
        <p className="text-xs font-mono font-semibold text-brutal-purple-dark">
          {displayHandle}
        </p>
      </div>

      {/* Edit Profile Button in Electric Purple */}
      <div className="w-full pt-3">
        <Link
          href="/profile"
          className="w-full py-2 px-4 rounded-xl bg-brutal-purple hover:bg-brutal-purple-dark text-white font-sans font-black text-xs border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center space-x-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <User className="w-3.5 h-3.5" />
          <span>Edit Profile</span>
        </Link>
      </div>
    </div>
  );
}

