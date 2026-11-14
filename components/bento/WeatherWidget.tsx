import React from "react";
import { MapPin, Sun, Cloud } from "lucide-react";

export function WeatherWidget() {
  return (
    <div className="bg-brutal-blue border-2 border-black rounded-3xl p-5 shadow-brutal text-white flex flex-col justify-between relative overflow-hidden h-full min-h-[160px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 font-bold text-sm tracking-wide bg-black/15 px-2.5 py-1 rounded-full border border-black/20 backdrop-blur-sm">
          <MapPin className="w-3.5 h-3.5 text-white" />
          <span>Bengaluru</span>
        </div>
        <div className="w-3 h-3 rounded-full bg-white animate-ping opacity-75" />
      </div>

      <div className="my-2 flex items-center justify-between">
        <div>
          <div className="text-4xl sm:text-5xl font-black font-sans tracking-tight text-white drop-shadow-[2px_2px_0px_#000]">
            24°C
          </div>
          <p className="text-xs font-bold text-white/90 mt-0.5">Partly Cloudy &bull; MSRUAS</p>
        </div>

        {/* Sun and Cloud Graphic */}
        <div className="relative w-14 h-14 shrink-0">
          <Sun className="w-9 h-9 text-brutal-yellow absolute -top-1 -right-1 animate-spin-slow" />
          <Cloud className="w-11 h-11 text-white fill-white absolute bottom-0 left-0 drop-shadow-[2px_2px_0px_#000000]" />
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-white/80 border-t border-black/15 pt-2">
        <span>Campus High: 28°</span>
        <span>Low: 20°</span>
      </div>
    </div>
  );
}

