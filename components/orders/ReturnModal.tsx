"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RotateCcw, X, AlertTriangle, RefreshCw } from "lucide-react";
import { Button, Card, Select, Textarea } from "@/components/ui";

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
        senderId: user.uid,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-modern-primary/70 backdrop-blur-sm">
      <Card variant="elevated" padding="md" className="max-w-md w-full space-y-4" role="dialog" aria-modal="true" aria-labelledby="return-modal-title">
        
        <div className="flex justify-between items-start border-b border-modern-border pb-3">
          <div className="flex items-center space-x-2 text-modern-text-primary">
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <h3 id="return-modal-title" className="font-sans font-semibold text-lg text-modern-text-primary">
              Request Order Return
            </h3>
          </div>
          <Button type="button" onClick={onClose} variant="ghost" size="sm" aria-label="Close return request" className="p-1.5">
            <X className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </div>

        <p className="text-xs font-mono text-modern-text-secondary">
          Order for: <strong className="text-modern-text-primary">{listingTitle}</strong>
        </p>

        {error && (
          <div className="p-3 bg-modern-error-light border border-modern-border text-modern-error text-xs font-mono font-semibold rounded-xl flex items-start space-x-2" role="alert">
            <AlertTriangle className="w-4 h-4 text-modern-error flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select
              label="Return Grounds"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={[
                { value: "Item condition does not match description", label: "Item condition does not match description" },
                { value: "Wrong textbook edition or missing syllabus units", label: "Wrong textbook edition or missing syllabus units" },
                { value: "Defective scientific calculator or equipment", label: "Defective scientific calculator or equipment" },
                { value: "Seller did not arrive at scheduled meetup spot", label: "Seller did not arrive at scheduled meetup spot" },
              ]}
            />
          </div>

          <div>
            <Textarea
              label="Explanation for Seller / Administration"
              rows={3}
              required
              placeholder="Explain why the item is being returned..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" onClick={onClose} variant="ghost" size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              size="md"
              leftIcon={loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : undefined}
            >
              {loading ? (
                "Filing..."
              ) : (
                "Submit Return Request"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

