"use client";

import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  htmlFor?: string;
}

/**
 * Consistent label component with required indicator
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required = false, htmlFor, children, className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={`block text-xs font-mono font-semibold text-modern-text-primary uppercase tracking-wider mb-1.5 ${className}`}
        {...props}
      >
        {children}
        {required && (
          <span className="text-modern-danger ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Modern Input Component
 * Replaces all neo-brutalist input patterns with semantic, accessible modern design
 * Supports label, error/hint states, icons, and proper accessibility
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      fullWidth = true,
      className = "",
      id,
      required,
      disabled,
      readOnly,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    const describedBy = [errorId, hintId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    const baseInputStyles =
      "w-full transition-colors duration-200 bg-modern-surface border rounded-xl text-sm font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-modern-surface-hover";

    const inputStyles = error
      ? `${baseInputStyles} border-modern-danger focus:border-modern-danger focus:ring-modern-danger/40`
      : `${baseInputStyles} border-modern-border hover:border-modern-border/80 focus:border-modern-primary focus:ring-modern-primary/40`;

    const widthStyles = fullWidth ? "w-full" : "";

    const hasLeftElement = leftIcon || leftElement;
    const hasRightElement = rightIcon || rightElement;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && <Label htmlFor={inputId} required={required}>{label}</Label>}

        <div className="relative">
          {hasLeftElement && (
            <div
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-modern-text-tertiary pointer-events-none flex-shrink-0"
              aria-hidden="true"
            >
              {leftElement || leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            className={`${inputStyles} ${hasLeftElement ? "pl-10" : "pl-4"} ${hasRightElement ? "pr-10" : "pr-4"} py-2.5 ${widthStyles} ${className}`}
            {...props}
          />

          {hasRightElement && (
            <div
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-modern-text-tertiary pointer-events-none flex-shrink-0"
              aria-hidden="true"
            >
              {rightElement || rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-modern-danger flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs font-mono text-modern-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

/**
 * Modern Textarea Component
 * Consistent styling with Input component
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      fullWidth = true,
      className = "",
      id,
      required,
      disabled,
      readOnly,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    const describedBy = [errorId, hintId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    const baseStyles =
      "w-full transition-colors duration-200 bg-modern-surface border rounded-xl text-sm font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed read-only:bg-modern-surface-hover resize-y min-h-[80px]";

    const inputStyles = error
      ? `${baseStyles} border-modern-danger focus:border-modern-danger focus:ring-modern-danger/40`
      : `${baseStyles} border-modern-border hover:border-modern-border/80 focus:border-modern-primary focus:ring-modern-primary/40`;

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && <Label htmlFor={textareaId} required={required}>{label}</Label>}

        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          className={`${inputStyles} px-4 py-3 ${widthStyles} ${className}`}
          {...props}
        />

        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-modern-danger flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs font-mono text-modern-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  fullWidth?: boolean;
}

/**
 * Modern Select Component
 * Consistent styling with Input component
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      fullWidth = true,
      className = "",
      id,
      required,
      disabled,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    const describedBy = [errorId, hintId, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    const baseStyles =
      "w-full transition-colors duration-200 bg-modern-surface border rounded-xl text-sm font-medium text-modern-text-primary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";

    const inputStyles = error
      ? `${baseStyles} border-modern-danger focus:border-modern-danger focus:ring-modern-danger/40`
      : `${baseStyles} border-modern-border hover:border-modern-border/80 focus:border-modern-primary focus:ring-modern-primary/40`;

    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && <Label htmlFor={selectId} required={required}>{label}</Label>}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            className={`${inputStyles} px-4 py-2.5 pr-10 ${widthStyles} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Custom dropdown arrow */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-modern-text-tertiary pointer-events-none flex-shrink-0" aria-hidden="true">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-medium text-modern-danger flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-xs font-mono text-modern-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

/**
 * Field wrapper for grouping related inputs with shared label/error
 */
export interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, required, children, className = "" }: FieldProps) {
  const fieldId = label?.toLowerCase().replace(/\s+/g, "-") || "field";
  const errorId = error ? `${fieldId}-error` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      {label && <Label htmlFor={fieldId} required={required}>{label}</Label>}
      <div>{children}</div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-modern-danger flex items-center gap-1" role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs font-mono text-modern-text-tertiary">
          {hint}
        </p>
      )}
    </div>
  );
}