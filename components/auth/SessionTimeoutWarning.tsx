"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, Sparkles, ShieldAlert } from "lucide-react";

export function SessionTimeoutWarning() {
  const { isWarningVisible, secondsRemaining, resetActivityTimer } = useAuth();

  if (!isWarningVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-modern-surface border border-modern-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-modern-lg space-y-5 relative">

        {/* Top Accent Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-modern-warm-light text-modern-warm-text border border-modern-warm/30 rounded-full text-xs font-mono font-semibold">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>CAMPUS SESSION SECURITY</span>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-xl text-modern-text-primary tracking-tight flex items-center space-x-2">
            <span>Are You Still There?</span>
          </h3>
          <p className="text-xs font-mono text-modern-text-tertiary leading-relaxed">
            No activity detected for 9 minutes. To protect your student account on shared university library and lab computers, your session will automatically terminate in:
          </p>
        </div>

        {/* Live Countdown Display */}
        <div className="p-4 bg-modern-surface-hover border border-modern-border rounded-xl flex items-center justify-between shadow-modern-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-modern-primary text-white flex items-center justify-center font-mono font-semibold text-xs border border-modern-primary/30">
              SEC
            </div>
            <span className="text-3xl sm:text-4xl font-mono font-semibold text-modern-text-primary tracking-wider">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-modern-admin text-white text-[10px] font-mono font-semibold rounded-lg uppercase tracking-wider animate-pulse">
            Idle Warning
          </span>
        </div>

        <p className="text-[11px] font-mono font-semibold text-modern-text-tertiary">
          Moving your mouse, tapping the screen, pressing any key, or clicking below will immediately refresh your 10-minute session.
        </p>

        {/* Interactive Stay Logged In Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={resetActivityTimer}
            className="w-full py-3 bg-modern-warm hover:bg-modern-warm-hover text-modern-warm-text font-semibold text-xs rounded-lg shadow-modern-sm hover:shadow-modern-md active:scale-[0.98] transition flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
}

