"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RotateCcw, X, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

interface ReturnModalProps {
  orderId: string;
  listingTitle: string;
  sellerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReturnModal({
  orderId,
  listingTitle,
  sellerId,
  isOpen,
  onClose,
  onSuccess,
}: ReturnModalProps) {
  const { user, profile } = useAuth();
  const [reason, setReason] = useState("Item condition does not match description");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const returnRef = doc(collection(db, "returns"));
      await setDoc(returnRef, {
        id: returnRef.id,
        orderId,
        listingTitle,
        buyerId: user.uid,
        buyerName: profile?.name || "Student Buyer",
        sellerId,
        reason: `${reason}${details ? ": " + details.trim() : ""}`,
        status: "requested",
        createdAt: serverTimestamp(),
      });

      // Notify seller
      const notifRef = doc(collection(db, `notifications/${sellerId}/items`));
      await setDoc(notifRef, {
        id: notifRef.id,
        type: "order",
        text: `Return requested for "${listingTitle}". Reason: ${reason}.`,
        link: `/orders/${orderId}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      onSuccess();
    } catch (err: any) {
      console.error("[Return submission error]:", err);
      setError("Failed to submit return request: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/50 backdrop-blur-sm">
      <div className="bg-paper-50 border border-ink-300 rounded-notice max-w-md w-full p-6 shadow-float space-y-4">
        
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2 text-saffron-600">
            <RotateCcw className="w-5 h-5" />
            <h3 className="font-serif font-bold text-lg text-ink-950">
              Request Order Return
            </h3>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-950 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-ink-600">
          Order for: <strong className="text-ink-900">{listingTitle}</strong>
        </p>

        {error && (
          <div className="p-3 bg-admin-50 border border-admin-600/30 text-admin-900 text-xs rounded-notice flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-admin-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
              Return Grounds
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-paper-100 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-saffron-500"
            >
              <option>Item condition does not match description</option>
              <option>Wrong textbook edition or missing syllabus units</option>
              <option>Defective scientific calculator or equipment</option>
              <option>Seller did not arrive at scheduled meetup spot</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
              Explanation for Seller / Administration
            </label>
            <textarea
              rows={3}
              required
              placeholder="Explain why the item is being returned..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
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
              className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Filing...</span>
                </>
              ) : (
                <span>Submit Return Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

