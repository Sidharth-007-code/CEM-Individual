"use client";

import React, { forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"
  | "warm";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Modern Button Component
 * Replaces all neo-brutalist button patterns with semantic, accessible modern design
 * Variants map to modern design tokens: primary (navy), secondary (slate), outline, ghost, danger (red), success (green), warm (amber)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-4 py-2 text-sm rounded-xl gap-2",
      lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-modern-primary hover:bg-modern-primary-hover text-white border border-modern-primary shadow-modern-sm hover:shadow-modern focus-visible:ring-modern-primary/40",
      secondary:
        "bg-modern-surface hover:bg-modern-surface-hover text-modern-text-primary border border-modern-border shadow-modern-sm hover:shadow-modern focus-visible:ring-modern-border",
      outline:
        "bg-transparent hover:bg-modern-primary-light text-modern-primary border-2 border-modern-primary focus-visible:ring-modern-primary/40",
      ghost:
        "bg-transparent hover:bg-modern-surface-hover text-modern-text-primary border border-transparent focus-visible:ring-modern-border",
      danger:
        "bg-modern-danger hover:bg-modern-danger-hover text-white border border-modern-danger shadow-modern-sm hover:shadow-modern focus-visible:ring-modern-danger/40",
      success:
        "bg-modern-success hover:bg-modern-success-hover text-white border border-modern-success shadow-modern-sm hover:shadow-modern focus-visible:ring-modern-success/40",
      warm:
        "bg-modern-warm hover:bg-modern-warm-hover text-modern-warm-text border border-modern-warm shadow-modern-sm hover:shadow-modern focus-visible:ring-modern-warm/40",
    };

    const widthStyles = fullWidth ? "w-full" : "";

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Link-styled button for navigation actions that look like links
 */
export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      leftIcon,
      rightIcon,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    const sizeStyles: Record<"sm" | "md" | "lg", string> = {
      sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
      md: "px-4 py-2 text-sm rounded-xl gap-2",
      lg: "px-6 py-3 text-base rounded-2xl gap-2.5",
    };

    const variantStyles: Record<"primary" | "secondary" | "ghost" | "outline", string> = {
      primary:
        "text-modern-primary hover:text-modern-primary-hover hover:underline focus-visible:ring-modern-primary/40",
      secondary:
        "text-modern-text-secondary hover:text-modern-text-primary hover:underline focus-visible:ring-modern-border",
      ghost:
        "text-modern-text-tertiary hover:text-modern-text-primary hover:underline focus-visible:ring-modern-border",
      outline:
        "text-modern-primary hover:text-modern-primary-hover border-2 border-modern-primary hover:bg-modern-primary-light rounded-xl focus-visible:ring-modern-primary/40",
    };

    return (
      <a
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </a>
    );
  }
);

LinkButton.displayName = "LinkButton";