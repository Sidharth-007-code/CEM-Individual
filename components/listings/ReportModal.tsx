"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MAX_REPORTS_BEFORE_HIDE } from "@/lib/constants";
import { Flag, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

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

  if (!isOpen) return null;

  const reasonOptions = [
    { value: "Misleading or fraudulent price", label: "Misleading or fraudulent price" },
    { value: "Prohibited or dangerous item", label: "Prohibited or dangerous item" },
    { value: "Inappropriate or offensive content", label: "Inappropriate or offensive content" },
    { value: "Counterfeit or unauthorized item", label: "Counterfeit or unauthorized item" },
    { value: "Item already sold / seller unresponsive", label: "Item already sold / seller unresponsive" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Campus Listing"
      size="md"
      description={`Reporting: ${listingTitle}`}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      {error && (
        <div className="mb-4 p-3 bg-modern-danger-light border border-modern-danger/30 text-modern-danger text-sm font-mono font-medium rounded-xl flex items-start space-x-2 shadow-modern-sm" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 stroke-[2.5]" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-modern-success-light rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-modern-success stroke-[2.5]" aria-hidden="true" />
          </div>
          <p className="font-sans font-semibold text-base text-modern-text-primary">
            Report Submitted for Moderation
          </p>
          <p className="text-sm font-mono text-modern-text-tertiary">
            Thank you for keeping Campus Marketplace safe and trustworthy.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-modern-text-primary uppercase tracking-wider mb-1.5">
              Violation Reason
            </label>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={reasonOptions}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-semibold text-modern-text-primary uppercase tracking-wider mb-1.5">
              Additional Details (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Explain the issue for the university administrative review team..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-4 py-3 bg-modern-surface border border-modern-border rounded-xl text-sm font-medium text-modern-text-primary placeholder:text-modern-text-tertiary focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-modern-primary focus:ring-modern-primary/40 disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[80px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={loading} className="w-full sm:w-auto" leftIcon={loading ? undefined : <Flag className="w-3.5 h-3.5" />}>
              {loading ? "Submitting..." : "Submit Flag to Admin"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}