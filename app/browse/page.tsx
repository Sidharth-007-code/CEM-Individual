import React from "react";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";

export default function BrowsePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-ink-200 pb-3">
        <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
          Campus Notice Board
        </h1>
        <p className="text-xs text-ink-600 mt-1">
          Explore all verified items currently available for peer-to-peer student handover on campus.
        </p>
      </div>

      <BrowseNoticeBoard />
    </div>
  );
}

