"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, QrCode, AlertTriangle, X } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-modern-primary/70 backdrop-blur-sm">
      <Card variant="elevated" padding="md" className="max-w-sm w-full space-y-5" role="dialog" aria-modal="true" aria-labelledby="upi-modal-title">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-modern-border pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span id="upi-modal-title" className="font-sans font-semibold text-lg text-modern-text-primary">Campus UPI Payment</span>
              <Badge variant="warm" size="xs">
                Testnet Sandbox
              </Badge>
            </div>
            <p className="text-[11px] font-mono font-bold text-modern-text-tertiary mt-0.5">
              Zero-fee peer-to-peer student transfer simulator.
            </p>
          </div>
          <Button type="button" onClick={onClose} variant="ghost" size="sm" aria-label="Close payment simulator" className="p-1.5">
            <X className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>

        {/* QR & Amount Card */}
        <div className="bg-modern-bg border border-modern-border rounded-2xl p-4 text-center space-y-3 shadow-modern-sm">
          <div className="w-32 h-32 mx-auto bg-white border border-modern-border rounded-xl flex flex-col items-center justify-center shadow-modern-sm">
            <QrCode className="w-20 h-20 text-modern-text-primary stroke-[2]" />
            <span className="text-[9px] font-mono font-semibold text-modern-text-primary mt-1">SIMULATED QR</span>
          </div>

          <div>
            <div className="font-sans text-2xl font-semibold text-modern-text-primary">
              ₹{amount.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-modern-text-secondary font-mono font-bold truncate max-w-xs mx-auto">
              {listingTitle}
            </p>
            <p className="text-[10px] text-modern-text-tertiary font-mono mt-1">
              VPA: <span className="font-bold underline text-modern-text-primary">msruas.escrow@upi</span>
            </p>
          </div>
        </div>

        {/* Feedback states */}
        {simState === "success" && (
          <div className="p-3 bg-modern-success-light border border-modern-border rounded-xl text-xs font-mono font-semibold text-modern-text-primary flex items-center space-x-2" role="status">
            <CheckCircle2 className="w-4 h-4 text-modern-text-primary stroke-[2.5] flex-shrink-0" />
            <span>Simulated UPI authorization succeeded! Creating order...</span>
          </div>
        )}

        {simState === "failed" && (
          <div className="p-3 bg-modern-error-light border border-modern-border rounded-xl text-xs font-mono font-semibold text-modern-error flex items-start space-x-2" role="alert">
            <AlertTriangle className="w-4 h-4 text-modern-error flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-sans font-semibold text-modern-text-primary">Simulated Payment Failed</strong>
              <span>Transaction declined. As required by business rules, failed payments never confirm orders. You may retry or switch to Cash.</span>
            </div>
          </div>
        )}

        {/* Action Simulation Controls */}
        <div className="space-y-2.5 pt-1">
          <Button
            type="button"
            onClick={handleSimulateSuccess}
            variant="success"
            fullWidth
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            <span>Simulate Successful UPI Pay</span>
          </Button>

          <Button
            type="button"
            onClick={handleSimulateFailure}
            variant="outline"
            fullWidth
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            <span>Simulate Failed Payment Response</span>
          </Button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono font-bold text-modern-text-tertiary hover:text-modern-text-primary underline"
          >
            Cancel and Return to Checkout
          </button>
        </div>
      </Card>
    </div>
  );
}

