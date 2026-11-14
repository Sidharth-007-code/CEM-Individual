import React from "react";

interface MockBadgeProps {
  label?: string;
  className?: string;
}

/**
 * Standardized badge to label intentionally simplified demo features (FR-07, FR-12)
 * as mandated by university project specification.
 */
export function MockBadge({ label = "Mocked Feature", className = "" }: MockBadgeProps) {
  return (
    <span
      title="This feature runs in interactive simulation/mock mode for campus marketplace demonstration."
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide bg-amber-100 text-amber-900 border border-amber-300 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
      {label}
    </span>
  );
}

