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
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium tracking-wide bg-modern-warm-light text-modern-warm-text border border-modern-warm/30 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-modern-warm mr-1.5 animate-pulse" />
      {label}
    </span>
  );
}

