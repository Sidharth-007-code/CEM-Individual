"use client";

import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "warm"
  | "verifier"
  | "admin"
  | "outline";

export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

/**
 * Modern Badge Component
 * Replaces all neo-brutalist badge patterns with semantic, accessible modern design
 * Variants map to modern design tokens
 */
export function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  pulse = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center font-mono font-semibold border transition-colors";

  const sizeStyles: Record<BadgeSize, string> = {
    xs: "px-2 py-0.5 text-[10px] rounded gap-1",
    sm: "px-2.5 py-1 text-[11px] rounded-md gap-1.5",
    md: "px-3 py-1.5 text-xs rounded-lg gap-2",
  };

  const variantStyles: Record<BadgeVariant, string> = {
    default:
      "bg-modern-surface-hover text-modern-text-secondary border-modern-border",
    primary:
      "bg-modern-primary-light text-modern-primary border-modern-primary/30",
    secondary:
      "bg-modern-surface-hover text-modern-text-tertiary border-modern-border",
    success:
      "bg-modern-success-light text-modern-success border-modern-success/30",
    warning:
      "bg-modern-warning-light text-modern-warning border-modern-warning/30",
    danger:
      "bg-modern-danger-light text-modern-danger border-modern-danger/30",
    warm:
      "bg-modern-warm-light text-modern-warm-text border-modern-warm/30",
    verifier:
      "bg-modern-verifier-light text-modern-verifier border-modern-verifier/30",
    admin:
      "bg-modern-admin-light text-modern-admin border-modern-admin/30",
    outline:
      "bg-transparent text-modern-text-secondary border-modern-border hover:bg-modern-surface-hover",
  };

  const dotStyles = "w-1.5 h-1.5 rounded-full flex-shrink-0";

  const dotVariantStyles: Record<BadgeVariant, string> = {
    default: "bg-modern-text-tertiary",
    primary: "bg-modern-primary",
    secondary: "bg-modern-text-tertiary",
    success: "bg-modern-success",
    warning: "bg-modern-warning",
    danger: "bg-modern-danger",
    warm: "bg-modern-warm",
    verifier: "bg-modern-verifier",
    admin: "bg-modern-admin",
    outline: "bg-modern-border",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`${dotStyles} ${dotVariantStyles[variant]} ${pulse ? "animate-pulse" : ""}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/**
 * StatusBadge - specialized for status indicators
 */
export type StatusBadgeType =
  | "available"
  | "pending"
  | "sold"
  | "approved"
  | "rejected"
  | "active"
  | "inactive"
  | "verified"
  | "unverified";

export interface StatusBadgeProps {
  status: StatusBadgeType;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, size = "sm", className = "" }: StatusBadgeProps) {
  const statusConfig: Record<StatusBadgeType, { label: string; variant: BadgeVariant; dot: boolean }> = {
    available: { label: "Available", variant: "success", dot: true },
    pending: { label: "Pending Review", variant: "warning", dot: true },
    sold: { label: "Sold", variant: "default", dot: false },
    approved: { label: "Approved", variant: "success", dot: true },
    rejected: { label: "Rejected", variant: "danger", dot: false },
    active: { label: "Active", variant: "primary", dot: true },
    inactive: { label: "Inactive", variant: "default", dot: false },
    verified: { label: "Verified", variant: "verifier", dot: true },
    unverified: { label: "Unverified", variant: "warning", dot: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={config.dot} className={className}>
      {config.label}
    </Badge>
  );
}

/**
 * PillBadge - for tab-like navigation pills
 */
export interface PillBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  count?: number;
}

export function PillBadge({
  active = false,
  variant = "secondary",
  size = "sm",
  count,
  className = "",
  children,
  ...props
}: PillBadgeProps) {
  const baseStyles =
    "inline-flex items-center font-sans font-semibold border-2 transition-all";

  const sizeStyles: Record<"sm" | "md", string> = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2 text-sm rounded-2xl gap-2",
  };

  const activeStyles: Record<string, string> = {
    primary: "bg-modern-primary text-white border-modern-primary shadow-modern-sm",
    secondary: "bg-modern-surface text-modern-text-primary border-modern-border shadow-modern-sm",
    success: "bg-modern-success text-white border-modern-success shadow-modern-sm",
    warning: "bg-modern-warm text-modern-warm-text border-modern-warm shadow-modern-sm",
    danger: "bg-modern-danger text-white border-modern-danger shadow-modern-sm",
  };

  const inactiveStyles: Record<string, string> = {
    primary: "bg-transparent text-modern-primary border-modern-primary hover:bg-modern-primary-light",
    secondary: "bg-transparent text-modern-text-secondary border-modern-border hover:bg-modern-surface-hover",
    success: "bg-transparent text-modern-success border-modern-success hover:bg-modern-success-light",
    warning: "bg-transparent text-modern-warm-text border-modern-warm hover:bg-modern-warm-light",
    danger: "bg-transparent text-modern-danger border-modern-danger hover:bg-modern-danger-light",
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${sizeStyles[size]} ${active ? activeStyles[variant] : inactiveStyles[variant]} ${className}`}
      {...props}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-current/20">
          {count}
        </span>
      )}
    </button>
  );
}