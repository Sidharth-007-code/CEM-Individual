"use client";

import React, { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";

export function MusicWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(40); // 1:24 / 3:30

  return (
    <div className="bg-white border-2 border-black rounded-3xl p-5 shadow-brutal flex flex-col justify-between h-full min-h-[160px] group hover:-translate-y-1 transition-transform">
      <div className="flex items-center space-x-3.5">
        {/* Spinning Vinyl Record with album art */}
        <div
          className={`w-12 h-12 rounded-full bg-black border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center relative shrink-0 ${
            isPlaying ? "animate-spin" : ""
          }`}
          style={{ animationDuration: "6s" }}
        >
          <div className="w-5 h-5 rounded-full bg-brutal-purple border border-white flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>

        <div className="truncate">
          <h4 className="font-sans font-black text-sm text-black truncate">Stargazing</h4>
          <p className="text-xs font-semibold text-ink-600 truncate">Travis Scott &bull; Astroworld</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="my-2 space-y-1">
        <div
          className="w-full bg-paper-200 h-2 rounded-full border border-black overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setProgress(Math.round(clickPos * 100));
          }}
        >
          <div
            className="bg-brutal-purple h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono font-bold text-ink-600">
          <span>1:24</span>
          <span>3:30</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          className="text-ink-600 hover:text-black transition"
          aria-label="Shuffle"
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-1 text-black hover:scale-110 active:scale-95 transition"
            aria-label="Previous"
          >
            <SkipBack className="w-4 h-4 fill-black" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full bg-brutal-purple hover:bg-brutal-purple-dark text-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            className="p-1 text-black hover:scale-110 active:scale-95 transition"
            aria-label="Next"
          >
            <SkipForward className="w-4 h-4 fill-black" />
          </button>
        </div>

        <button
          type="button"
          className="text-ink-600 hover:text-black transition"
          aria-label="Repeat"
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

