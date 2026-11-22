import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  withText?: boolean;
  className?: string;
  badgeOnly?: boolean;
  href?: string;
}

export function Logo({
  size = "md",
  withText = true,
  className = "",
  badgeOnly = false,
  href = "/",
}: LogoProps) {
  // Dimensions for the icon container
  const sizeMap = {
    sm: { box: "w-8 h-8", icon: "w-5 h-5", text: "text-lg", sub: "text-[9px]" },
    md: { box: "w-10 h-10", icon: "w-6 h-6", text: "text-xl", sub: "text-[10px]" },
    lg: { box: "w-12 h-12", icon: "w-7 h-7", text: "text-2xl", sub: "text-xs" },
    xl: { box: "w-16 h-16", icon: "w-10 h-10", text: "text-3xl", sub: "text-sm" },
  };

  const current = sizeMap[size];

  const content = (
    <div className={`inline-flex items-center space-x-2.5 group cursor-pointer select-none ${className}`}>
      {/* Modern Logo Badge - Navy background with clean styling */}
      <div
        className={`${current.box} rounded-xl bg-modern-primary border border-modern-border shadow-modern-sm group-hover:shadow-modern-md group-hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center shrink-0`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${current.icon} text-white transform rotate-[-45deg]`}
        >
          {/* Interlocking infinity double-loop */}
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      {withText && !badgeOnly && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1.5">
            <span className={`font-sans font-black tracking-tight text-modern-text-primary ${current.text}`}>
              Campus Market
            </span>
            <span className="px-1.5 py-0.5 bg-modern-warm-light text-modern-warm-text border border-modern-warm/30 rounded-md text-[9px] font-mono font-bold tracking-wider uppercase">
              RUAS
            </span>
          </div>
          <span className={`font-mono text-modern-text-tertiary font-medium tracking-wide ${current.sub} mt-0.5`}>
            MSRUAS Verified Exchange
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

