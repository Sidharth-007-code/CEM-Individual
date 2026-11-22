"use client";

import React, { forwardRef, useState } from "react";
import { ImageProps } from "next/image";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type AvatarShape = "circle" | "square" | "rounded";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: "online" | "offline" | "busy" | "away";
  statusPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

/**
 * Modern Avatar Component
 * Replaces all neo-brutalist avatar patterns with semantic, accessible modern design
 * Supports image, fallback initials, status indicators, and multiple sizes/shapes
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      fallback,
      size = "md",
      shape = "circle",
      status,
      statusPosition = "bottom-right",
      className = "",
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(!!src);

    const sizeStyles: Record<AvatarSize, string> = {
      xs: "w-6 h-6 text-[10px]",
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
      xl: "w-16 h-16 text-lg",
      "2xl": "w-24 h-24 text-xl",
    };

    const shapeStyles: Record<AvatarShape, string> = {
      circle: "rounded-full",
      square: "rounded-none",
      rounded: "rounded-xl",
    };

    const statusSizeStyles: Record<AvatarSize, string> = {
      xs: "w-1.5 h-1.5",
      sm: "w-2 h-2",
      md: "w-2.5 h-2.5",
      lg: "w-3 h-3",
      xl: "w-3.5 h-3.5",
      "2xl": "w-4 h-4",
    };

    const statusPositionStyles: Record<string, string> = {
      "bottom-right": "bottom-0 right-0",
      "bottom-left": "bottom-0 left-0",
      "top-right": "top-0 right-0",
      "top-left": "top-0 left-0",
    };

    const statusStyles: Record<string, string> = {
      online: "bg-modern-success",
      offline: "bg-modern-text-tertiary",
      busy: "bg-modern-danger",
      away: "bg-modern-warning",
    };

    const showFallback = !src || imageError;
    const displayName = fallback || alt || "User";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Generate consistent background color from name
    const getColorFromName = (name: string) => {
      const colors = [
        "bg-modern-primary-light",
        "bg-modern-success-light",
        "bg-modern-warning-light",
        "bg-modern-info-light",
        "bg-modern-verifier-light",
        "bg-modern-admin-light",
        "bg-modern-warm-light",
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    const fallbackBg = getColorFromName(displayName);
    const fallbackTextColors: Record<string, string> = {
      "bg-modern-primary-light": "text-modern-primary",
      "bg-modern-success-light": "text-modern-success",
      "bg-modern-warning-light": "text-modern-warning",
      "bg-modern-info-light": "text-modern-info",
      "bg-modern-verifier-light": "text-modern-verifier",
      "bg-modern-admin-light": "text-modern-admin",
      "bg-modern-warm-light": "text-modern-warm-text",
    };

    const fallbackTextColor = fallbackTextColors[fallbackBg] || "text-modern-text-primary";

    return (
      <div
        ref={ref}
        className={`relative inline-flex shrink-0 ${sizeStyles[size]} ${shapeStyles[shape]} ${className}`}
        {...props}
      >
        {showFallback ? (
          <div
            className={`w-full h-full ${shapeStyles[shape]} ${fallbackBg} flex items-center justify-center font-semibold ${fallbackTextColor} ${fallbackTextColor === "text-modern-warm-text" ? "font-mono" : ""}`}
            aria-label={alt || displayName}
          >
            {initials}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || displayName}
            onLoad={() => setIsLoading(false)}
            onError={() => setImageError(true)}
            className={`w-full h-full ${shapeStyles[shape]} object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
            loading="lazy"
          />
        )}

        {status && (
          <span
            className={`absolute ${statusPositionStyles[statusPosition]} ${statusSizeStyles[size]} rounded-full border-2 border-modern-surface ${statusStyles[status]}`}
            aria-label={`Status: ${status}`}
          />
        )}

        {isLoading && !showFallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-modern-surface-hover/50">
            <div className="w-4 h-4 border-2 border-modern-border border-t-modern-primary rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: { src?: string; alt?: string; fallback?: string }[];
  maxVisible?: number;
  size?: AvatarSize;
  overlap?: boolean;
  className?: string;
}

/**
 * AvatarGroup - displays multiple avatars with overlap
 */
export function AvatarGroup({
  avatars,
  maxVisible = 5,
  size = "md",
  overlap = true,
  className = "",
  ...props
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = avatars.length - maxVisible;

  const sizeStyles: Record<AvatarSize, string> = {
    xs: "w-6 h-6 -ml-1",
    sm: "w-8 h-8 -ml-2",
    md: "w-10 h-10 -ml-3",
    lg: "w-12 h-12 -ml-4",
    xl: "w-16 h-16 -ml-5",
    "2xl": "w-24 h-24 -ml-6",
  };

  const overlapStyle = overlap ? sizeStyles[size] : "ml-1";

  return (
    <div className={`flex items-center ${className}`} {...props}>
      <div className="flex" aria-label={`${avatars.length} users`}>
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={avatar.src || avatar.fallback || avatar.alt || index}
            src={avatar.src}
            alt={avatar.alt}
            fallback={avatar.fallback}
            size={size}
            className={index > 0 ? overlapStyle : ""}
          />
        ))}
        {remainingCount > 0 && (
          <Avatar
            fallback={`+${remainingCount}`}
            size={size}
            className={overlapStyle}
            aria-label={`${remainingCount} more users`}
          >
            <div className="w-full h-full bg-modern-surface-hover border border-modern-border flex items-center justify-center text-xs font-mono text-modern-text-tertiary">
              +{remainingCount}
            </div>
          </Avatar>
        )}
      </div>
    </div>
  );
}

/**
 * AvatarStack - vertical stack of avatars
 */
export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: { src?: string; alt?: string; fallback?: string }[];
  maxVisible?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarStack({
  avatars,
  maxVisible = 4,
  size = "md",
  className = "",
  ...props
}: AvatarStackProps) {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const remainingCount = avatars.length - maxVisible;

  return (
    <div className={`flex flex-col space-y-1 ${className}`} {...props}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.src || avatar.fallback || avatar.alt || index}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
        />
      ))}
      {remainingCount > 0 && (
        <Avatar
          fallback={`+${remainingCount}`}
          size={size}
          aria-label={`${remainingCount} more users`}
        >
          <div className="w-full h-full bg-modern-surface-hover border border-modern-border flex items-center justify-center text-xs font-mono text-modern-text-tertiary">
            +{remainingCount}
          </div>
        </Avatar>
      )}
    </div>
  );
}