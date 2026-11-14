"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MAX_REPORTS_BEFORE_HIDE } from "@/lib/constants";
import { Flag, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

interface ReportModalProps {
  listingId: string;
  listingTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ listingId, listingTitle, isOpen, onClose }: ReportModalProps) {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState("Misleading or fraudulent price");
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to report a listing.");
      return;
    }

    setLoading(true);
    setError(null);

    const reportDocId = `${listingId}_${user.uid}`;
    const reportRef = doc(db, "reports", reportDocId);
    const listingRef = doc(db, "listings", listingId);

    try {
      // 1. Check if user already reported this listing
      const existingSnap = await getDoc(reportRef);
      if (existingSnap.exists()) {
        setError("You have already reported this listing. The university moderation team is reviewing it.");
        setLoading(false);
        return;
      }

      // 2. Fetch current listing to evaluate report threshold
      const listingSnap = await getDoc(listingRef);
      if (!listingSnap.exists()) {
        setError("Listing no longer exists.");
        setLoading(false);
        return;
      }

      const currentReportCount = listingSnap.data()?.reportCount || 0;
      const newReportCount = currentReportCount + 1;

      // 3. Store Report
      await setDoc(reportRef, {
        id: reportDocId,
        listingId,
        listingTitle,
        reporterId: user.uid,
        reporterName: profile?.name || "Student",
        reason: `${reason}${customNote ? " - " + customNote.trim() : ""}`,
        status: "open",
        createdAt: serverTimestamp(),
      });

      // 4. Update listing reportCount. If >= threshold (3), auto-transition to hidden!
      const updateData: any = {
        reportCount: increment(1),
        updatedAt: serverTimestamp(),
      };

      if (newReportCount >= MAX_REPORTS_BEFORE_HIDE) {
        updateData.status = "hidden";
      }

      await updateDoc(listingRef, updateData);

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("[Report error]:", err);
      setError("Failed to submit report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm">
      <div className="bg-paper-50 border border-ink-300 rounded-notice max-w-md w-full p-6 shadow-float space-y-4">
        
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2 text-admin-600">
            <Flag className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-ink-950">
              Report Campus Listing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-950 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-600">
          Reporting: <strong className="text-ink-900">{listingTitle}</strong>
        </p>

        {error && (
          <div className="p-3 bg-admin-50 border border-admin-600/30 text-admin-900 text-xs rounded-notice flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-verifier-600 mx-auto" />
            <p className="font-serif font-bold text-sm text-ink-950">
              Report Submitted for Moderation
            </p>
            <p className="text-xs text-ink-600">
              Thank you for keeping Campus Marketplace safe and trustworthy.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Violation Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-paper-100 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
              >
                <option>Misleading or fraudulent price</option>
                <option>Prohibited or dangerous item</option>
                <option>Inappropriate or offensive content</option>
                <option>Counterfeit or unauthorized item</option>
                <option>Item already sold / seller unresponsive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Explain the issue for the university administrative review team..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 bg-paper-100 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-ink-700 hover:text-ink-950"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-admin-600 hover:bg-admin-700 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Flag to Admin</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

