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
      bg: "bg-brutal-green",
      iconBg: "bg-white",
      Icon: CheckCircle2,
      textColor: "text-black",
    },
    warning: {
      bg: "bg-brutal-pink",
      iconBg: "bg-white",
      Icon: AlertTriangle,
      textColor: "text-black",
    },
    info: {
      bg: "bg-brutal-blue",
      iconBg: "bg-white",
      Icon: Info,
      textColor: "text-black",
    },
  }[type];

  const { bg, iconBg, Icon, textColor } = config;

  return (
    <div
      className={`${bg} border-2 border-black rounded-2xl p-3 shadow-brutal flex items-center justify-between space-x-3 ${className}`}
    >
      <div className="flex items-center space-x-3 truncate">
        <div
          className={`w-7 h-7 rounded-xl ${iconBg} border-2 border-black shadow-[1px_1px_0px_#000] flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4 text-black stroke-[2.5]" />
        </div>
        <div className="truncate">
          <div className={`font-sans font-black text-xs ${textColor}`}>
            {title}
          </div>
          <div className="text-[11px] font-medium text-black/80 truncate">
            {message}
          </div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-black/10 rounded-lg transition"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5 text-black" />
        </button>
      )}
    </div>
  );
}

