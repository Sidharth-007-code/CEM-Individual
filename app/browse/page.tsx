import React from "react";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";

export default function BrowsePage() {
  return (
    <div className="space-y-6">
      <div className="border-b-2 border-black/10 pb-4">
        <h1 className="font-sans text-3xl font-black text-black tracking-tight">
          Campus Notice Board
        </h1>
        <p className="text-xs font-mono font-bold text-ink-600 mt-1">
          Explore all verified items currently available for peer-to-peer student handover on campus.
        </p>
      </div>

      <BrowseNoticeBoard />
    </div>
  );
}

