import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarWidget() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Dates matching the reference image layout:
  // Row 1: 1, 2, 2, 7, 8, 8, 9 (faint/previous)
  // Row 2: 8, 9, 10, 11 (active highlighted), 12, 13, 14
  const activeDate = 11;

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[160px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center justify-between border-b border-black/10 pb-2">
        <h4 className="font-sans font-black text-sm text-black">November 2026</h4>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            className="p-1 hover:bg-paper-200 rounded border border-transparent hover:border-black transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 hover:bg-paper-200 rounded border border-transparent hover:border-black transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center my-1.5">
        {days.map((d) => (
          <span key={d} className="text-[10px] font-mono font-bold text-ink-600">
            {d}
          </span>
        ))}

        {/* Row 1 dates */}
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <span key={`prev-${num}`} className="text-xs font-mono font-semibold text-ink-300 py-0.5">
            {num}
          </span>
        ))}

        {/* Row 2 active university dates */}
        {[8, 9, 10, 11, 12, 13, 14].map((num) => {
          const isActive = num === activeDate;
          return (
            <div key={num} className="flex items-center justify-center py-0.5">
              {isActive ? (
                <span className="w-6 h-6 rounded-full bg-brutal-yellow border-2 border-black font-mono font-black text-xs text-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
                  {num}
                </span>
              ) : (
                <span className="text-xs font-mono font-bold text-ink-950">
                  {num}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-mono font-bold text-ink-600 pt-1 border-t border-black/10 flex justify-between items-center">
        <span>Term Exam Week</span>
        <span className="text-brutal-purple-dark font-black">RUAS Term 1</span>
      </div>
    </div>
  );
}

