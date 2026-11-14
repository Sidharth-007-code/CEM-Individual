"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { MockBadge } from "@/components/ui/MockBadge";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function VerifierQueuePage() {
  const { user } = useAuth();
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Subscribe to all pending listings
  useEffect(() => {
    const listingsRef = collection(db, "listings");
    const q = query(listingsRef, where("status", "==", "pending"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Listing[];
        setPendingListings(items);
        if (items.length > 0 && !selectedListing) {
          setSelectedListing(items[0]);
        }
      },
      (err) => {
        console.warn("[VerifierQueue] Subscription error:", err.message);
      }
    );

    return () => unsubscribe();
  }, [selectedListing]);

  const handleDecision = async (listingId: string, decision: "available" | "rejected" | "needs_changes") => {
    if (!user) return;
    setProcessingId(listingId);
    setFeedbackMsg(null);

    try {
      const listingRef = doc(db, "listings", listingId);
      const note = actionNote.trim() || (decision === "available" ? "Approved by campus verifier." : "Decision recorded.");

      await updateDoc(listingRef, {
        status: decision,
        verifierId: user.uid,
        verifierNote: note,
        updatedAt: serverTimestamp(),
      });

      // Send notification to seller
      if (selectedListing?.sellerId) {
        const notifRef = doc(collection(db, `notifications/${selectedListing.sellerId}/items`));
        let text = "";
        if (decision === "available") {
          text = `Your listing "${selectedListing.title}" has been approved and published to the Notice Board!`;
        } else if (decision === "rejected") {
          text = `Your listing "${selectedListing.title}" was rejected: ${note}`;
        } else {
          text = `Changes requested for "${selectedListing.title}": ${note}`;
        }

        await setDoc(notifRef, {
          id: notifRef.id,
          type: "verification",
          text,
          link: `/listings/${listingId}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setFeedbackMsg(`Listing successfully marked as ${decision}.`);
      setActionNote("");
      // Select next pending item if available
      const remaining = pendingListings.filter((l) => l.id !== listingId);
      setSelectedListing(remaining[0] || null);
    } catch (err: any) {
      setFeedbackMsg("Failed to update status: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <RouteGuard allowedRoles={["verifier", "admin"]}>
      <div className="space-y-6">
        
        {/* Header Banner */}
        <div className="bg-verifier-50 border border-verifier-600/30 rounded-notice p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-full bg-verifier-600 text-white flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="font-serif text-2xl font-black text-verifier-900 tracking-tight">
                Campus Verification Queue
              </h1>
              <MockBadge label="Human Review Gate" />
            </div>
            <p className="text-xs text-verifier-700 mt-1">
              Course CSC203B verification portal. Mandates human quality confirmation before any item is displayed on the student notice board.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-verifier-100 text-verifier-800 text-xs font-mono font-bold rounded-full border border-verifier-600/40">
              {pendingListings.length} Pending Review
            </span>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-verifier-100 text-verifier-900 text-xs font-medium rounded-notice border border-verifier-600/30">
            {feedbackMsg}
          </div>
        )}

        {pendingListings.length === 0 ? (
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-12 text-center space-y-3">
            <CheckCircle className="w-10 h-10 mx-auto text-verifier-600" />
            <h3 className="font-serif text-lg font-bold text-ink-950">
              All Listings Clear
            </h3>
            <p className="text-xs text-ink-600 max-w-sm mx-auto">
              There are no pending submissions awaiting verifier moderation. All active items have been reviewed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Queue List (5 Cols) */}
            <div className="lg:col-span-5 bg-paper-100 border border-ink-200 rounded-notice overflow-hidden shadow-card flex flex-col">
              <div className="p-3 border-b border-ink-200 bg-paper-200/50 flex justify-between items-center text-xs font-serif font-bold text-ink-800">
                <span>Items Awaiting Decision</span>
                <span className="font-mono text-ink-500">{pendingListings.length} total</span>
              </div>

              <div className="divide-y divide-ink-200 overflow-y-auto max-h-[600px]">
                {pendingListings.map((listing) => {
                  const isSelected = selectedListing?.id === listing.id;
                  return (
                    <button
                      key={listing.id}
                      onClick={() => {
                        setSelectedListing(listing);
                        setActionNote("");
                      }}
                      className={`w-full p-4 text-left flex items-start space-x-3 transition ${
                        isSelected ? "bg-verifier-50 border-l-4 border-verifier-600" : "hover:bg-paper-50"
                      }`}
                    >
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt=""
                          className="w-14 h-14 rounded object-cover border border-ink-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded bg-paper-300 flex items-center justify-center text-ink-500 flex-shrink-0 text-xs">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-xs text-ink-950 truncate">
                          {listing.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-ink-600 mt-0.5">
                          <span className="font-mono font-bold text-saffron-700">₹{listing.price}</span>
                          <span>&bull;</span>
                          <span className="truncate">{listing.category}</span>
                        </div>
                        <p className="text-[10px] text-ink-500 mt-1">
                          Seller: {listing.sellerName || "Student"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Inspection & Decision Panel (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedListing ? (
                <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-5">
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b border-ink-200 pb-4">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-paper-200 text-ink-700 rounded border border-ink-300">
                        {selectedListing.category} &bull; {selectedListing.condition}
                      </span>
                      <h2 className="font-serif text-xl font-black text-ink-950 mt-1">
                        {selectedListing.title}
                      </h2>
                      <p className="text-xs text-ink-600 mt-0.5">
                        Seller: <strong>{selectedListing.sellerName}</strong> &bull; Contact: {selectedListing.sellerPhone || "None provided"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-serif text-2xl font-black text-saffron-600">
                        ₹{selectedListing.price}
                      </div>
                      <span className="text-[10px] text-ink-500 font-mono">Asking Price</span>
                    </div>
                  </div>

                  {/* Image Preview Carousel */}
                  {selectedListing.thumbnail && (
                    <div>
                      <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-2">
                        Uploaded Proof Photographs
                      </label>
                      <div className="flex space-x-3 overflow-x-auto pb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedListing.thumbnail}
                          alt="Primary"
                          className="w-48 h-48 object-cover rounded-notice border border-ink-300 flex-shrink-0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider mb-1">
                      Student Description
                    </label>
                    <p className="text-xs text-ink-800 bg-paper-50 p-3 rounded border border-ink-200 leading-relaxed whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                  </div>

                  {/* Automated Advisory Linter Advice Box (Mocked) */}
                  <div className="bg-paper-200/60 border border-ink-300 rounded p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-serif font-bold text-ink-900">
                      <span>Automated Pre-Check Report:</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        selectedListing.checkResult?.passed
                          ? "bg-verifier-100 text-verifier-800"
                          : "bg-amber-100 text-amber-900"
                      }`}>
                        {selectedListing.checkResult?.passed ? "Passed Bounds" : "Advisories Flagged"}
                      </span>
                    </div>

                    {selectedListing.checkResult?.reasons && selectedListing.checkResult.reasons.length > 0 ? (
                      <ul className="list-disc list-inside text-ink-700 text-[11px] space-y-1">
                        {selectedListing.checkResult.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-verifier-800">
                        No automated violations detected. Price is within category parameters.
                      </p>
                    )}
                  </div>

                  {/* Decision Controls */}
                  <div className="border-t border-ink-200 pt-4 space-y-3">
                    <label className="block text-xs font-serif font-bold text-ink-800 uppercase tracking-wider">
                      Verifier Remark / Feedback Note (Visible to Student)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified genuine edition. Fair pricing for condition."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="w-full px-3 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs text-ink-900 focus:outline-none focus:border-verifier-600"
                    />

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => handleDecision(selectedListing.id, "available")}
                        disabled={processingId === selectedListing.id}
                        className="py-2.5 bg-verifier-600 hover:bg-verifier-700 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve Listing</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "needs_changes")}
                        disabled={processingId === selectedListing.id}
                        className="py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "rejected")}
                        disabled={processingId === selectedListing.id}
                        className="py-2.5 bg-admin-600 hover:bg-admin-700 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Listing</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

