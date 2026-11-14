"use client";

import React, { useState } from "react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border-2 border-black rounded-3xl max-w-sm w-full p-6 shadow-brutal space-y-5">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black/10 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-sans font-black text-lg text-black">Campus UPI Payment</span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-black bg-brutal-yellow text-black border border-black rounded-md shadow-[1px_1px_0px_#000]">
                Testnet Sandbox
              </span>
            </div>
            <p className="text-[11px] font-mono font-bold text-ink-600 mt-0.5">
              Zero-fee peer-to-peer student transfer simulator.
            </p>
          </div>
          <button onClick={onClose} className="text-black hover:bg-paper-200 p-1.5 rounded-xl border border-black">
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* QR & Amount Card */}
        <div className="bg-paper-50 border-2 border-black rounded-2xl p-4 text-center space-y-3 shadow-[2px_2px_0px_#000]">
          <div className="w-32 h-32 mx-auto bg-white border-2 border-black rounded-xl flex flex-col items-center justify-center shadow-[2px_2px_0px_#000]">
            <QrCode className="w-20 h-20 text-black stroke-[2]" />
            <span className="text-[9px] font-mono font-black text-black mt-1">SIMULATED QR</span>
          </div>

          <div>
            <div className="font-sans text-2xl font-black text-black">
              ₹{amount.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-ink-700 font-mono font-bold truncate max-w-xs mx-auto">
              {listingTitle}
            </p>
            <p className="text-[10px] text-ink-500 font-mono mt-1">
              VPA: <span className="font-bold underline text-black">msruas.escrow@upi</span>
            </p>
          </div>
        </div>

        {/* Feedback states */}
        {simState === "success" && (
          <div className="p-3 bg-brutal-green/30 border-2 border-black rounded-xl text-xs font-mono font-bold text-black flex items-center space-x-2 animate-bounce shadow-[2px_2px_0px_#000]">
            <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0" />
            <span>Simulated UPI authorization succeeded! Creating order...</span>
          </div>
        )}

        {simState === "failed" && (
          <div className="p-3 bg-admin-50 border-2 border-black rounded-xl text-xs font-mono font-bold text-admin-900 flex items-start space-x-2 shadow-[2px_2px_0px_#000]">
            <AlertTriangle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-sans font-black text-black">Simulated Payment Failed</strong>
              <span>Transaction declined. As required by business rules, failed payments never confirm orders. You may retry or switch to Cash.</span>
            </div>
          </div>
        )}

        {/* Action Simulation Controls */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleSimulateSuccess}
            className="w-full py-3 bg-brutal-green hover:opacity-90 text-black font-sans font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center justify-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Simulate Successful UPI Pay</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateFailure}
            className="w-full py-3 bg-admin-100 hover:bg-admin-200 text-admin-900 border-2 border-black font-sans font-black text-xs rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center justify-center space-x-1.5"
          >
            <XCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Simulate Failed Payment Response</span>
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-mono font-bold text-ink-600 hover:text-black underline"
          >
            Cancel and Return to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

