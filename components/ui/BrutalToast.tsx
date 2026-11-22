import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface ToastProps {
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function BrutalToast({
  type,
  title,
  message,
  onClose,
  className = "",
}: ToastProps) {
  const config = {
    success: {
      bg: "bg-modern-success-light",
      border: "border-modern-success/30",
      iconBg: "bg-modern-success/10",
      Icon: CheckCircle2,
      iconColor: "text-modern-success",
      textColor: "text-modern-text-primary",
      titleColor: "text-modern-text-primary",
    },
    warning: {
      bg: "bg-modern-warning-light",
      border: "border-modern-warning/30",
      iconBg: "bg-modern-warning/10",
      Icon: AlertTriangle,
      iconColor: "text-modern-warning",
      textColor: "text-modern-text-primary",
      titleColor: "text-modern-text-primary",
    },
    info: {
      bg: "bg-modern-info-light",
      border: "border-modern-info/30",
      iconBg: "bg-modern-info/10",
      Icon: Info,
      iconColor: "text-modern-info",
      textColor: "text-modern-text-primary",
      titleColor: "text-modern-text-primary",
    },
  }[type];

  const { bg, border, iconBg, Icon, iconColor, textColor, titleColor } = config;

  return (
    <div
      className={`${bg} ${border} rounded-lg p-3 shadow-modern-md flex items-center justify-between space-x-3 ${className}`}
    >
      <div className="flex items-center space-x-3 truncate">
        <div
          className={`w-7 h-7 rounded-lg ${iconBg} border ${border} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4 stroke-2" />
        </div>
        <div className="truncate">
          <div className={`font-semibold text-xs ${titleColor}`}>
            {title}
          </div>
          <div className="text-[11px] font-medium text-modern-text-tertiary truncate">
            {message}
          </div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-modern-border rounded-lg transition text-modern-text-tertiary hover:text-modern-text-primary"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

