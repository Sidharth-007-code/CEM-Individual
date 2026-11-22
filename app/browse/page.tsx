import React from "react";
import { BrowseNoticeBoard } from "@/components/listings/BrowseNoticeBoard";

export default function BrowsePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-modern-border/50 pb-4">
        <h1 className="font-sans text-3xl font-bold text-modern-text-primary tracking-tight">
          Campus Notice Board
        </h1>
        <p className="text-sm font-mono font-medium text-modern-text-tertiary mt-1">
          Explore all verified items currently available for peer-to-peer student handover on campus.
        </p>
      </div>

      <BrowseNoticeBoard />
    </div>
  );
}