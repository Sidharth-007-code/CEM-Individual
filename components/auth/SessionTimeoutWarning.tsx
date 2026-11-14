"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Clock, Sparkles, ShieldAlert } from "lucide-react";

export function SessionTimeoutWarning() {
  const { isWarningVisible, secondsRemaining, resetActivityTimer } = useAuth();

  if (!isWarningVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border-3 border-black rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0px_#000] space-y-5 relative overflow-hidden bg-grid-pattern">
        
        {/* Top Accent Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-brutal-yellow border-2 border-black rounded-full shadow-[2px_2px_0px_#000] text-xs font-mono font-black text-black">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>CAMPUS SESSION SECURITY</span>
        </div>

        <div className="space-y-2">
          <h3 className="font-sans font-black text-2xl text-black tracking-tight flex items-center space-x-2">
            <span>Are You Still There?</span>
          </h3>
          <p className="text-xs font-mono text-ink-700 leading-relaxed">
            No activity detected for 9 minutes. To protect your student account on shared university library and lab computers, your session will automatically terminate in:
          </p>
        </div>

        {/* Live Countdown Display */}
        <div className="p-4 bg-paper-100 border-2 border-black rounded-2xl flex items-center justify-between shadow-[2px_2px_0px_#000]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-mono font-black text-xs border border-black">
              SEC
            </div>
            <span className="text-3xl sm:text-4xl font-mono font-black text-black tracking-wider">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-admin-600 text-white text-[10px] font-mono font-black rounded-lg uppercase tracking-wider animate-pulse">
            Idle Warning
          </span>
        </div>

        <p className="text-[11px] font-mono font-bold text-ink-600">
          Moving your mouse, tapping the screen, pressing any key, or clicking below will immediately refresh your 10-minute session.
        </p>

        {/* Interactive Stay Logged In Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={resetActivityTimer}
            className="w-full py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] hover:-translate-y-0.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
}

