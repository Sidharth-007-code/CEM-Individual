"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, TrackingEvent } from "@/types/order";
import { UserProfile } from "@/types/user";
import { MEETUP_SPOTS, MeetupSpot } from "@/lib/constants";
import { ReturnModal } from "@/components/orders/ReturnModal";
import {
  Package,
  Clock,
  CheckCircle2,
  MapPin,
  FileText,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  Calendar,
  XCircle,
  RefreshCw,
  Phone,
} from "lucide-react";

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, isAdmin } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Meetup update modal / drawer
  const [showMeetupEdit, setShowMeetupEdit] = useState(false);
  const [newMeetupSpot, setNewMeetupSpot] = useState<MeetupSpot>(MEETUP_SPOTS[0]);
  const [newMeetupTime, setNewMeetupTime] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Return modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const orderRef = doc(db, "orders", id);

    const unsubscribeOrder = onSnapshot(
      orderRef,
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as Order;
          // Guard: user must be buyer, seller, or admin
          if (data.buyerId === user.uid || data.sellerId === user.uid || isAdmin) {
            setOrder(data);
            if (data.meetupSpot) {
              setNewMeetupSpot(data.meetupSpot as MeetupSpot);
            }
          } else {
            setOrder(null);
          }
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Order snapshot error:", err.message);
        setLoading(false);
      }
    );

    // Subscribe to tracking events subcollection
    const trackingRef = collection(db, `orders/${id}/tracking`);
    const unsubscribeTracking = onSnapshot(
      trackingRef,
      (snap) => {
        const events = snap.docs.map((d) => d.data() as TrackingEvent);
        // Sort chronologically
        events.sort((a, b) => {
          const aT = a.at?.toMillis ? a.at.toMillis() : 0;
          const bT = b.at?.toMillis ? b.at.toMillis() : 0;
          return aT - bT;
        });
        setTrackingEvents(events);
      },
      (err) => {
        console.warn("Tracking subcollection error:", err.message);
      }
    );

    return () => {
      unsubscribeOrder();
      unsubscribeTracking();
    };
  }, [id, user, isAdmin]);

  // Fetch live peer student profile for contact phone and verification
  useEffect(() => {
    if (!order || !user) return;
    const peerId = user.uid === order.buyerId ? order.sellerId : order.buyerId;
    if (!peerId) return;

    const fetchPeer = async () => {
      try {
        const snap = await getDoc(doc(db, "users", peerId));
        if (snap.exists()) {
          setPeerProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch (e) {
        console.warn("[OrderTracking] Peer profile fetch error:", e);
      }
    };
    fetchPeer();
  }, [order, user]);

  const advanceOrderStatus = async (newStatus: OrderStatus, noteText: string) => {
    if (!order) return;
    setUpdatingStatus(true);
    setFeedbackMsg(null);

    try {
      const orderRef = doc(db, "orders", order.id);
      const trackingRef = collection(db, `orders/${order.id}/tracking`);

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      await addDoc(trackingRef, {
        status: newStatus,
        note: noteText,
        at: serverTimestamp(),
      });

      setFeedbackMsg(`Order updated to: ${newStatus.replace("_", " ")}`);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setUpdatingStatus(true);

    try {
      const orderRef = doc(db, "orders", order.id);
      const trackingRef = collection(db, `orders/${order.id}/tracking`);

      await updateDoc(orderRef, {
        status: "meetup_scheduled",
        meetupSpot: newMeetupSpot,
        meetupTime: newMeetupTime,
        updatedAt: serverTimestamp(),
      });

      await addDoc(trackingRef, {
        status: "meetup_scheduled",
        note: `Meetup scheduled at ${newMeetupSpot}. Proposed time: ${newMeetupTime}.`,
        at: serverTimestamp(),
      });

      setShowMeetupEdit(false);
      setFeedbackMsg("Meetup spot and schedule updated.");
    } catch (err: any) {
      alert("Failed to schedule meetup: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-serif text-ink-600">Loading order timeline...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-paper-100 border border-ink-200 rounded-notice p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-admin-600 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ink-950">Order Not Accessible</h2>
        <p className="text-xs text-ink-600">You are not an authorized participant for this order.</p>
        <Link href="/orders" className="inline-block px-4 py-2 bg-ink-950 text-paper-50 rounded text-xs font-serif font-bold">
          Return to Orders
        </Link>
      </div>
    );
  }

  const isBuyer = user?.uid === order.buyerId;
  const isSeller = user?.uid === order.sellerId;

  // Stages
  const stages: { key: OrderStatus; label: string }[] = [
    { key: "created", label: "Placed" },
    { key: "confirmed", label: "Payment Confirmed" },
    { key: "meetup_scheduled", label: "Meetup Scheduled" },
    { key: "completed", label: "Handover Complete" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === order.status);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center space-x-1 text-xs font-medium text-ink-600 hover:text-ink-950"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Orders List</span>
          </Link>

          <Link
            href={`/orders/${order.id}/invoice`}
            className="px-3 py-1.5 bg-paper-100 hover:bg-paper-200 border border-ink-300 rounded-notice text-xs font-serif font-bold text-ink-900 flex items-center space-x-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5 text-saffron-600" />
            <span>View Printable Invoice</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="bg-paper-100 border border-ink-200 rounded-notice p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-ink-200 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif text-2xl font-black text-ink-950 tracking-tight">
                  Order #{order.id.slice(0, 8)}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded uppercase ${
                    order.status === "completed"
                      ? "bg-verifier-100 text-verifier-800 border border-verifier-600/30"
                      : order.status === "cancelled"
                      ? "bg-admin-100 text-admin-800 border border-admin-600/30"
                      : "bg-saffron-100 text-saffron-800 border border-saffron-300"
                  }`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-ink-600 mt-0.5">
                Item: <strong>{order.listingTitle}</strong> &bull; Amount: <strong>₹{order.price.toLocaleString("en-IN")}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-ink-500 block">
                {isBuyer ? "Purchased from Seller" : "Sold to Student Buyer"}
              </span>
              <span className="font-serif font-bold text-sm text-ink-950 block">
                {peerProfile?.name || (isBuyer ? order.sellerName : order.buyerName)}
              </span>
              {peerProfile?.course && (
                <span className="text-[11px] text-ink-500 block">
                  {peerProfile.course} {peerProfile.year ? `• ${peerProfile.year}` : ""}
                </span>
              )}
              {peerProfile?.phone && (
                <a
                  href={`tel:${peerProfile.phone}`}
                  className="inline-flex items-center space-x-1 text-xs font-mono text-verifier-700 hover:text-verifier-900 underline mt-0.5"
                  title="Call for handover coordination"
                >
                  <Phone className="w-3 h-3 text-verifier-600" />
                  <span>Call {peerProfile.phone}</span>
                </a>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-verifier-50 text-verifier-900 border border-verifier-600/30 text-xs font-medium rounded">
              {feedbackMsg}
            </div>
          )}

          {/* Progress Bar / Milestones */}
          {order.status !== "cancelled" ? (
            <div className="py-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {stages.map((stg, i) => {
                  const isDone = currentStageIndex >= i;
                  const isCurrent = currentStageIndex === i;
                  return (
                    <div key={stg.key} className="space-y-1.5">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDone ? "bg-verifier-600" : "bg-paper-300"
                        }`}
                      />
                      <span
                        className={`text-[10px] sm:text-xs font-serif block ${
                          isCurrent
                            ? "font-bold text-ink-950"
                            : isDone
                            ? "text-verifier-800"
                            : "text-ink-400"
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-admin-50 border border-admin-600 text-admin-900 text-xs font-medium rounded flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-admin-600 flex-shrink-0" />
              <span>This order was cancelled. Handover is terminated.</span>
            </div>
          )}
        </div>

        {/* Handover Meetup Spot & Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: Handover Spot & Timeline (7 Cols) */}
          <div className="md:col-span-7 space-y-5">
            
            {/* Spot Card */}
            <div className="bg-paper-100 border border-ink-200 rounded-notice p-5 space-y-3 shadow-card">
              <div className="flex justify-between items-center">
                <h3 className="font-serif font-bold text-sm text-ink-950 flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-saffron-600" />
                  <span>Campus Meetup Handover Spot</span>
                </h3>
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <button
                    onClick={() => setShowMeetupEdit(!showMeetupEdit)}
                    className="text-xs text-saffron-600 hover:text-saffron-700 underline font-medium"
                  >
                    {showMeetupEdit ? "Close" : "Reschedule Meetup"}
                  </button>
                )}
              </div>

              {!showMeetupEdit ? (
                <div className="p-3.5 bg-paper-50 rounded border border-ink-200 space-y-1">
                  <div className="font-serif font-bold text-xs text-ink-950">
                    {order.meetupSpot || "No meetup spot confirmed yet."}
                  </div>
                  {order.meetupTime && (
                    <div className="text-xs text-ink-600 flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-ink-500" />
                      <span>{order.meetupTime}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-ink-500 mt-1">
                    CCTV-monitored safe university exchange point.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateMeetup} className="p-3 bg-paper-50 rounded border border-ink-300 space-y-3">
                  <div>
                    <label className="block text-[11px] font-serif font-bold text-ink-800 uppercase mb-1">
                      Choose Monitored Spot
                    </label>
                    <select
                      value={newMeetupSpot}
                      onChange={(e) => setNewMeetupSpot(e.target.value as MeetupSpot)}
                      className="w-full px-2.5 py-1.5 bg-paper-100 border border-ink-300 rounded text-xs text-ink-900"
                    >
                      {MEETUP_SPOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-serif font-bold text-ink-800 uppercase mb-1">
                      Proposed Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Today at 4:30 PM (after Lab)"
                      value={newMeetupTime}
                      onChange={(e) => setNewMeetupTime(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-paper-100 border border-ink-300 rounded text-xs text-ink-900"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowMeetupEdit(false)}
                      className="px-2.5 py-1 text-xs text-ink-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-3 py-1 bg-saffron-500 text-white rounded text-xs font-serif font-bold shadow-sm"
                    >
                      Save Meetup Plan
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Tracking History Log */}
            <div className="bg-paper-100 border border-ink-200 rounded-notice p-5 space-y-3 shadow-card">
              <h3 className="font-serif font-bold text-sm text-ink-950 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-ink-700" />
                <span>Tracking History Timeline</span>
              </h3>

              <div className="divide-y divide-ink-200 text-xs">
                {trackingEvents.length === 0 ? (
                  <p className="py-3 text-ink-500 italic">No events recorded.</p>
                ) : (
                  trackingEvents.map((evt, idx) => (
                    <div key={idx} className="py-2.5 flex items-start space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-verifier-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-serif font-bold text-ink-950 block">
                          {evt.status.replace("_", " ").toUpperCase()}
                        </span>
                        <p className="text-ink-700 mt-0.5">{evt.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions & Return (5 Cols) */}
          <div className="md:col-span-5 space-y-5">
            
            <div className="bg-paper-100 border border-ink-200 rounded-notice p-5 space-y-4 shadow-card">
              <h3 className="font-serif font-bold text-sm text-ink-950">
                Order Status Controls
              </h3>

              {order.status === "created" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("confirmed", "Payment and handover terms confirmed.")}
                  className="w-full py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition"
                >
                  Confirm Order &amp; Agreement
                </button>
              )}

              {order.status === "meetup_scheduled" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("completed", "Item inspected and physically handed over at meetup spot.")}
                  className="w-full py-2.5 bg-verifier-600 hover:bg-verifier-700 text-white text-xs font-serif font-bold rounded-notice shadow-sm transition"
                >
                  Confirm Physical Handover Complete
                </button>
              )}

              {order.status !== "completed" && order.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("cancelled", "Order cancelled by student.")}
                  className="w-full py-2 bg-paper-50 hover:bg-admin-50 text-admin-800 border border-admin-600/30 text-xs font-serif font-bold rounded-notice transition"
                >
                  Cancel Order
                </button>
              )}

              {/* Return Request (For Buyer if completed or issues) */}
              {isBuyer && order.status === "completed" && (
                <div className="pt-3 border-t border-ink-200">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    className="w-full py-2 text-xs font-serif text-ink-700 hover:text-admin-700 flex items-center justify-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Report Issue / Request Return</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Return Modal */}
        <ReturnModal
          orderId={order.id}
          listingTitle={order.listingTitle || "Item"}
          sellerId={order.sellerId}
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          onSuccess={() => {
            setReturnModalOpen(false);
            setFeedbackMsg("Return request submitted for seller & administration review.");
          }}
        />
      </div>
    </RouteGuard>
  );
}

