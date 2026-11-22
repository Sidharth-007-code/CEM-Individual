"use client";

import React, { HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Modern Card Component
 * Replaces all neo-brutalist card patterns with semantic, accessible modern design
 * Variants: default (subtle shadow), elevated (stronger shadow), outlined (border only), interactive (hover effects)
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", className = "", children, ...props }, ref) => {
    const baseStyles = "bg-modern-surface rounded-2xl transition-all duration-200";

    const variantStyles: Record<string, string> = {
      default: "shadow-modern-sm border border-modern-border/50",
      elevated: "shadow-modern-lg border border-modern-border/30",
      outlined: "shadow-none border-2 border-modern-border",
      interactive:
        "shadow-modern-sm border border-modern-border/50 hover:shadow-modern-lg hover:-translate-y-0.5 hover:border-modern-primary/30 cursor-pointer",
    };

    const paddingStyles: Record<string, string> = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Card Header with optional title, subtitle, and action
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 ${className}`}
        {...props}
      >
        <div className="flex-1">
          {children || (
            <>
              {title && (
                <h3 className="font-sans font-semibold text-lg text-modern-text-primary tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm font-medium text-modern-text-tertiary mt-1">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
        {action && <div className="flex-shrink-0 mt-2 sm:mt-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Card Content wrapper
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Card Footer with consistent spacing
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col sm:flex-row sm:items-center justify-end gap-3 mt-6 pt-4 border-t border-modern-border/50 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

/**
 * CardGrid - responsive grid layout for cards
 */
export interface CardGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function CardGrid({
  cols = 3,
  gap = "md",
  className = "",
  children,
  ...props
}: CardGridProps) {
  const colsStyles: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const gapStyles: Record<string, string> = {
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={`grid ${colsStyles[cols]} ${gapStyles[gap]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * StatCard - specialized card for dashboard metrics
 */
export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; label: string; positive?: boolean };
  variant?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  className = "",
  children,
  ...props
}: StatCardProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-modern-surface border-modern-border/50",
    primary: "bg-modern-primary-light border-modern-primary/30",
    success: "bg-modern-success-light border-modern-success/30",
    warning: "bg-modern-warning-light border-modern-warning/30",
    info: "bg-modern-info-light border-modern-info/30",
  };

  const iconBgStyles: Record<string, string> = {
    default: "bg-modern-surface-hover border-modern-border",
    primary: "bg-modern-primary text-white border-modern-primary/30",
    success: "bg-modern-success text-white border-modern-success/30",
    warning: "bg-modern-warm text-modern-warm-text border-modern-warm/30",
    info: "bg-modern-info text-white border-modern-info/30",
  };

  return (
    <Card variant="default" padding="md" className={`${variantStyles[variant]} ${className}`} {...props}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono font-semibold text-modern-text-tertiary uppercase tracking-wider">
            {label}
          </p>
          <p className="font-sans font-black text-3xl text-modern-text-primary tracking-tight mt-1">
            {value}
          </p>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${iconBgStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span
            className={`text-xs font-mono font-semibold ${
              trend.positive !== false ? "text-modern-success" : "text-modern-danger"
            }`}
          >
            {trend.positive !== false ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-xs font-medium text-modern-text-tertiary">{trend.label}</span>
        </div>
      )}

      {children}
    </Card>
  );
}