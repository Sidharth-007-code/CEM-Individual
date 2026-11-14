"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { User, Sparkles, ShieldCheck } from "lucide-react";

export function UserProfileCard() {
  const { user, profile } = useAuth();

  // STRICT PRIVACY DIRECTIVE: Never display the verified student card to the public.
  // It is visible strictly to the authenticated student who is using the site, displaying their own name only.
  if (!user) {
    return null;
  }

  const displayName = profile?.name || user.displayName || user.email?.split("@")[0] || "Verified Student";
  const displayHandle = profile?.email
    ? `@${profile.email.split("@")[0]}`
    : `@${user.email?.split("@")[0] || "student"}`;

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col items-center justify-between text-center h-full min-h-[170px] relative group hover:-translate-y-1 transition-transform">
      <div className="w-full flex justify-between items-center text-xs font-mono font-bold text-ink-600">
        <span className="flex items-center space-x-1.5 px-2 py-0.5 bg-brutal-mint/30 border border-black rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span className="text-[11px] font-black text-black">Verified Student</span>
        </span>
        <span className="w-2.5 h-2.5 rounded-full bg-brutal-green border border-black animate-pulse" title="Active Session" />
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
            <div className="font-sans font-black text-2xl text-black">
              {displayName.charAt(0).toUpperCase()}
            </div>
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
