"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Listing } from "@/types/listing";
import { validateListingAI } from "@/lib/ai";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowRight,
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
        
        {/* Header Banner - Neo-Brutalist Layout */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-grid-pattern">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-10 h-10 rounded-xl bg-brutal-green text-black border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Campus Verification Queue
                </h1>
                <p className="text-xs font-mono font-bold text-ink-600 mt-0.5">
                  MSRUAS Human Quality &amp; Safety Review Gate
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3.5 py-1.5 bg-brutal-yellow text-black text-xs font-mono font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
              {pendingListings.length} Pending Moderation
            </span>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3.5 bg-brutal-green border-2 border-black rounded-2xl text-black font-bold text-xs shadow-[2px_2px_0px_#000]">
            {feedbackMsg}
          </div>
        )}

        {pendingListings.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-3 shadow-brutal">
            <div className="w-14 h-14 bg-brutal-green border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000]">
              <CheckCircle className="w-7 h-7 text-black stroke-[2.5]" />
            </div>
            <h3 className="font-sans text-xl font-black text-black">
              All Campus Listings Clear
            </h3>
            <p className="text-xs font-semibold text-ink-600 max-w-sm mx-auto">
              There are no pending submissions awaiting moderation. All student notice board items are up to date!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Queue List (5 Cols) */}
            <div className="lg:col-span-5 bg-white border-2 border-black rounded-3xl overflow-hidden shadow-brutal flex flex-col">
              <div className="p-4 border-b-2 border-black/10 bg-paper-100 flex justify-between items-center text-xs font-mono font-black text-black">
                <span>Items Awaiting Decision</span>
                <span>{pendingListings.length} total</span>
              </div>

              <div className="divide-y-2 divide-black/10 overflow-y-auto max-h-[640px]">
                {pendingListings.map((listing) => {
                  const isSelected = selectedListing?.id === listing.id;
                  return (
                    <button
                      key={listing.id}
                      onClick={() => {
                        setSelectedListing(listing);
                        setActionNote("");
                      }}
                      className={`w-full p-4 text-left flex items-start space-x-3.5 transition ${
                        isSelected
                          ? "bg-brutal-yellow/30 border-l-4 border-black"
                          : "hover:bg-paper-50"
                      }`}
                    >
                      {listing.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.thumbnail}
                          alt=""
                          className="w-16 h-16 rounded-xl object-cover border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-paper-200 border-2 border-black flex items-center justify-center text-black flex-shrink-0 text-xs font-mono font-bold">
                          No Pic
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-sans font-black text-xs text-black truncate">
                          {listing.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-ink-700 mt-1">
                          <span className="text-black font-black">₹{listing.price}</span>
                          <span>&bull;</span>
                          <span className="truncate">{listing.category}</span>
                        </div>
                        <p className="text-[10px] font-mono text-ink-500 mt-1">
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
                <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-brutal space-y-5">
                  
                  {/* Top Bar */}
                  <div className="flex justify-between items-start border-b-2 border-black/10 pb-4">
                    <div>
                      <span className="px-2.5 py-1 text-[10px] font-mono font-black uppercase bg-brutal-purple-light text-brutal-purple-dark rounded-lg border border-black shadow-[1px_1px_0px_#000]">
                        {selectedListing.category} &bull; {selectedListing.condition}
                      </span>
                      <h2 className="font-sans text-xl font-black text-black mt-2">
                        {selectedListing.title}
                      </h2>
                      <p className="text-xs font-mono text-ink-600 mt-0.5">
                        Seller: <strong className="text-black">{selectedListing.sellerName}</strong> &bull; Contact: {selectedListing.sellerPhone || "None provided"}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-sans text-3xl font-black text-black">
                        ₹{selectedListing.price}
                      </div>
                      <span className="text-[10px] text-ink-600 font-mono font-bold">Asking Price</span>
                    </div>
                  </div>

                  {/* Primary Thumbnail Preview */}
                  {selectedListing.thumbnail && (
                    <div>
                      <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-2">
                        Uploaded Proof Photograph
                      </label>
                      <div className="w-48 h-48 rounded-2xl overflow-hidden border-2 border-black shadow-brutal">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedListing.thumbnail}
                          alt="Primary"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider mb-1">
                      Student Description
                    </label>
                    <p className="text-xs font-semibold text-black bg-paper-50 p-3.5 rounded-xl border-2 border-black leading-relaxed whitespace-pre-wrap">
                      {selectedListing.description}
                    </p>
                  </div>

                  {/* AI Quality & Verifier Advisory Panel */}
                  {(() => {
                    const aiEval =
                      selectedListing.aiValidation ||
                      validateListingAI({
                        title: selectedListing.title,
                        description: selectedListing.description,
                        category: selectedListing.category,
                        condition: selectedListing.condition,
                        price: selectedListing.price,
                        imageCount: 3,
                      });

                    return (
                      <div className="bg-paper-50 border-2 border-black rounded-2xl p-4 text-xs space-y-3 shadow-[2px_2px_0px_#000]">
                        <div className="flex items-center justify-between border-b border-black/15 pb-2">
                          <span className="font-sans font-black text-black flex items-center space-x-1.5">
                            <Sparkles className="w-4 h-4 text-brutal-purple" />
                            <span>AI Quality &amp; Risk Assessment</span>
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-black border border-black ${
                            aiEval.overallPassed
                              ? "bg-brutal-green text-black"
                              : "bg-brutal-pink text-black"
                          }`}>
                            AI Advice: {aiEval.verifierAdvice.recommendedAction} ({aiEval.verifierAdvice.confidenceScore}% conf)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Safety &amp; Compliance</span>
                            <span className={`font-black text-xs ${aiEval.safetyCheck.status === "CLEARED" ? "text-verifier-800" : "text-admin-800"}`}>
                              {aiEval.safetyCheck.status === "CLEARED" ? "Cleared (Safe) ✅" : "Flagged ⚠️"}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Fair Market Range</span>
                            <span className="font-black text-xs text-black">
                              ₹{aiEval.priceEval.estimatedMin} - ₹{aiEval.priceEval.estimatedMax}
                            </span>
                          </div>
                          <div className="p-2.5 bg-white rounded-xl border border-black shadow-[1px_1px_0px_#000]">
                            <span className="text-[10px] text-ink-600 font-mono block">Quality Grade</span>
                            <span className="font-black text-xs text-black">
                              Grade {aiEval.qualityCheck.grade} ({aiEval.qualityCheck.qualityScore}/100)
                            </span>
                          </div>
                        </div>

                        {aiEval.verifierAdvice.summaryBulletPoints.length > 0 && (
                          <ul className="list-disc list-inside text-ink-700 text-[11px] space-y-1 font-medium">
                            {aiEval.verifierAdvice.summaryBulletPoints.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}

                  {/* Decision Controls */}
                  <div className="border-t-2 border-black/10 pt-4 space-y-3">
                    <label className="block text-xs font-mono font-black text-black uppercase tracking-wider">
                      Verifier Remark / Feedback Note (Sent to Student)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified genuine edition. Fair pricing for syllabus condition."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper-50 border-2 border-black rounded-xl text-xs font-medium text-black focus:outline-none focus:bg-white shadow-[2px_2px_0px_#000]"
                    />

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <button
                        onClick={() => handleDecision(selectedListing.id, "available")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 bg-brutal-green hover:bg-brutal-green-dark text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "needs_changes")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <HelpCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Needs Changes</span>
                      </button>

                      <button
                        onClick={() => handleDecision(selectedListing.id, "rejected")}
                        disabled={processingId === selectedListing.id}
                        className="py-3 bg-brutal-pink hover:bg-brutal-pink-dark text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Reject</span>
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
