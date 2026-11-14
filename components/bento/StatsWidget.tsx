import React from "react";
import { Calendar, Users, TrendingUp } from "lucide-react";

export function StatsWidget() {
  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[170px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
        <div className="flex items-center space-x-2">
          <span className="font-sans font-black text-sm text-black">Marketplace Pulse</span>
          <span className="px-2 py-0.5 bg-brutal-green text-black border border-black rounded-full text-[9px] font-mono font-bold uppercase">
            Live
          </span>
        </div>
        <TrendingUp className="w-4 h-4 text-ink-600" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 my-3">
        {/* Total Bookings / Exchanges */}
        <div className="bg-brutal-purple-light border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold text-ink-700 uppercase">Exchanges</span>
            <Calendar className="w-4 h-4 text-brutal-purple-dark" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-black text-black tracking-tight">248</div>
            <div className="text-[10px] font-mono font-bold text-brutal-purple-dark mt-0.5">
              &uarr; 12% this week
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="bg-brutal-green border-2 border-black rounded-2xl p-3 shadow-[2px_2px_0px_#000] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold text-ink-800 uppercase">Students</span>
            <Users className="w-4 h-4 text-ink-950" />
          </div>
          <div className="mt-1">
            <div className="text-2xl font-black text-black tracking-tight">1.2K</div>
            <div className="text-[10px] font-mono font-bold text-ink-900 mt-0.5">
              &uarr; 8% active
            </div>
          </div>
        </div>
      </div>

      {/* Mini SVG Smooth Activity Curve */}
      <div className="relative pt-1">
        <svg viewBox="0 0 200 45" className="w-full h-9 overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,35 Q 30,10 60,25 T 120,15 T 160,28 T 200,8 L 200,45 L 0,45 Z"
            fill="url(#purpleGrad)"
          />
          <path
            d="M 0,35 Q 30,10 60,25 T 120,15 T 160,28 T 200,8"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

