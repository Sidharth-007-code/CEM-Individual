"use client";

import React, { useState } from "react";
import { MockBadge } from "@/components/ui/MockBadge";
import { CheckCircle2, XCircle, QrCode, AlertTriangle, ShieldCheck, X } from "lucide-react";

interface UpiModalProps {
  amount: number;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onFailure: () => void;
}

export function UpiModal({
  amount,
  listingTitle,
  isOpen,
  onClose,
  onSuccess,
  onFailure,
}: UpiModalProps) {
  const [simState, setSimState] = useState<"idle" | "success" | "failed">("idle");

  if (!isOpen) return null;

  const handleSimulateSuccess = () => {
    setSimState("success");
    setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  const handleSimulateFailure = () => {
    setSimState("failed");
    onFailure();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm">
      <div className="bg-paper-50 border border-ink-300 rounded-notice max-w-sm w-full p-6 shadow-float space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-ink-200 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-black text-lg text-ink-950">UPI Payment</span>
              <MockBadge label="Interactive Mock" />
            </div>
            <p className="text-[11px] text-ink-600 mt-0.5">
              Simulated campus payment sandbox for CSC203B demonstration.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR & Amount Card */}
        <div className="bg-paper-100 border border-ink-200 rounded p-4 text-center space-y-3">
          <div className="w-32 h-32 mx-auto bg-white border border-ink-300 rounded flex flex-col items-center justify-center shadow-inner">
            <QrCode className="w-20 h-20 text-ink-900" />
            <span className="text-[9px] font-mono text-ink-500 mt-1">SIMULATED QR</span>
          </div>

          <div>
            <div className="font-serif text-2xl font-black text-ink-950">
              ₹{amount.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-ink-600 font-mono truncate max-w-xs mx-auto">
              {listingTitle}
            </p>
            <p className="text-[10px] text-ink-500 font-mono mt-1">
              VPA: <span className="underline">msruas.escrow@upi</span>
            </p>
          </div>
        </div>

        {/* Feedback states */}
        {simState === "success" && (
          <div className="p-3 bg-verifier-50 border border-verifier-600 rounded text-xs text-verifier-900 flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-verifier-600 flex-shrink-0" />
            <span>Simulated UPI authorization succeeded! Creating order...</span>
          </div>
        )}

        {simState === "failed" && (
          <div className="p-3 bg-admin-50 border border-admin-600 rounded text-xs text-admin-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-serif">Simulated Payment Failed</strong>
              <span>Transaction declined. As required by business rules, failed payments never confirm orders. You may retry or switch to Cash.</span>
            </div>
          </div>
        )}

        {/* Action Simulation Controls */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleSimulateSuccess}
            className="w-full py-2.5 bg-verifier-600 hover:bg-verifier-700 text-white font-serif font-bold text-xs rounded-notice shadow-sm transition flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simulate Successful UPI Pay</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateFailure}
            className="w-full py-2.5 bg-admin-50 hover:bg-admin-100 text-admin-800 border border-admin-600/40 font-serif font-bold text-xs rounded-notice transition flex items-center justify-center space-x-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Simulate Failed Payment Response</span>
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-600 hover:text-ink-950 underline"
          >
            Cancel and Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

