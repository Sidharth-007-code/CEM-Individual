"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertOctagon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Campus Marketplace Fatal Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#FDFBF7] text-black min-h-screen flex items-center justify-center p-4 font-sans selection:bg-[#FFD027]">
        <div className="max-w-md w-full bg-white border-2 border-black rounded-3xl p-8 sm:p-10 shadow-[4px_4px_0px_#000] flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Header Tag */}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-400 text-black border-2 border-black rounded-full text-xs font-mono font-black shadow-[2px_2px_0px_#000] mb-3">
            <AlertOctagon className="w-3.5 h-3.5 stroke-[3]" />
            <span>CRITICAL APP ERROR</span>
          </div>

          <h1 className="font-black text-6xl text-black tracking-tight drop-shadow-[3px_3px_0px_#FDA4AF]">
            Error
          </h1>

          <h2 className="font-black text-2xl text-black mt-2">
            Application Crash
          </h2>

          <p className="text-xs sm:text-sm font-semibold text-gray-700 mt-2 max-w-xs leading-relaxed">
            The application encountered a critical runtime error. Please reload the campus application.
          </p>

          {/* Action Button */}
          <div className="flex gap-3 w-full mt-6">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 py-3 px-4 bg-[#FFD027] hover:bg-[#FFE370] text-black font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center space-x-1.5"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>Reload Application</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = "/";
              }}
              className="py-3 px-4 bg-white hover:bg-gray-100 text-black font-black text-xs sm:text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

