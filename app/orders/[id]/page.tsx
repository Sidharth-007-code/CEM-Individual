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
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-ink-600">Loading order timeline...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <AlertCircle className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Order Not Accessible</h2>
        <p className="text-xs font-mono text-ink-600">You are not an authorized participant for this order.</p>
        <Link href="/orders" className="inline-block px-5 py-2.5 bg-brutal-yellow text-black border-2 border-black rounded-xl text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light">
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
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] hover:bg-paper-100 transition"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Back to Orders List</span>
          </Link>

          <Link
            href={`/orders/${order.id}/invoice`}
            className="px-3.5 py-1.5 bg-brutal-yellow hover:bg-brutal-yellow-light border-2 border-black rounded-xl text-xs font-sans font-black text-black flex items-center space-x-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>View Printable Invoice</span>
          </Link>
        </div>

        {/* Order Header Card */}
        <div className="bg-white border-2 border-black rounded-3xl p-6 sm:p-8 shadow-brutal space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-black/10 pb-4">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="font-sans text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Order #{order.id.slice(0, 8)}
                </h1>
                <span
                  className={`px-2.5 py-1 text-xs font-mono font-black rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#000] uppercase ${
                    order.status === "completed"
                      ? "bg-brutal-green text-black"
                      : order.status === "cancelled"
                      ? "bg-admin-100 text-admin-900"
                      : "bg-brutal-yellow text-black"
                  }`}
                >
                  {order.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs font-mono text-ink-700 mt-1">
                Item: <strong className="text-black">{order.listingTitle}</strong> &bull; Amount: <strong className="text-black">₹{order.price.toLocaleString("en-IN")}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-mono text-ink-500 block">
                {isBuyer ? "Purchased from Seller" : "Sold to Student Buyer"}
              </span>
              <span className="font-sans font-black text-sm text-black block">
                {peerProfile?.name || (isBuyer ? order.sellerName : order.buyerName)}
              </span>
              {peerProfile?.course && (
                <span className="text-[11px] font-mono text-ink-600 block">
                  {peerProfile.course} {peerProfile.year ? `• ${peerProfile.year}` : ""}
                </span>
              )}
              {peerProfile?.phone && (
                <a
                  href={`tel:${peerProfile.phone}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-black underline mt-1"
                  title="Call for handover coordination"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Call {peerProfile.phone}</span>
                </a>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="p-3.5 bg-brutal-green/20 text-black border-2 border-black text-xs font-mono font-bold rounded-xl shadow-[2px_2px_0px_#000]">
              {feedbackMsg}
            </div>
          )}

          {/* Progress Bar / Milestones */}
          {order.status !== "cancelled" ? (
            <div className="py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {stages.map((stg, i) => {
                  const isDone = currentStageIndex >= i;
                  const isCurrent = currentStageIndex === i;
                  return (
                    <div key={stg.key} className="space-y-1.5">
                      <div
                        className={`h-2.5 rounded-full border border-black transition-all ${
                          isDone ? "bg-brutal-green" : "bg-paper-200"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-mono block ${
                          isCurrent
                            ? "font-black text-black"
                            : isDone
                            ? "font-bold text-black"
                            : "text-ink-400 font-medium"
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
            <div className="p-3.5 bg-admin-50 border-2 border-black text-admin-900 text-xs font-mono font-bold rounded-xl shadow-[2px_2px_0px_#000] flex items-center space-x-2">
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
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-4 shadow-brutal">
              <div className="flex justify-between items-center">
                <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                  <MapPin className="w-4 h-4 stroke-[2.5]" />
                  <span>Campus Meetup Handover Spot</span>
                </h3>
                {order.status !== "completed" && order.status !== "cancelled" && (
                  <button
                    onClick={() => setShowMeetupEdit(!showMeetupEdit)}
                    className="text-xs font-mono font-bold text-black hover:underline"
                  >
                    {showMeetupEdit ? "Close" : "Reschedule Meetup"}
                  </button>
                )}
              </div>

              {!showMeetupEdit ? (
                <div className="p-4 bg-paper-50 rounded-xl border-2 border-black space-y-1 shadow-[2px_2px_0px_#000]">
                  <div className="font-sans font-black text-sm text-black">
                    {order.meetupSpot || "No meetup spot confirmed yet."}
                  </div>
                  {order.meetupTime && (
                    <div className="text-xs text-ink-700 flex items-center space-x-1.5 font-mono pt-1">
                      <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{order.meetupTime}</span>
                    </div>
                  )}
                  <p className="text-[10px] font-mono text-ink-500 mt-1">
                    CCTV-monitored safe university exchange point.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUpdateMeetup} className="p-4 bg-paper-50 rounded-xl border-2 border-black space-y-3 shadow-[2px_2px_0px_#000]">
                  <div>
                    <label className="block text-xs font-sans font-black text-black uppercase mb-1">
                      Choose Monitored Spot
                    </label>
                    <select
                      value={newMeetupSpot}
                      onChange={(e) => setNewMeetupSpot(e.target.value as MeetupSpot)}
                      className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]"
                    >
                      {MEETUP_SPOTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-black text-black uppercase mb-1">
                      Proposed Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Today at 4:30 PM (after Lab)"
                      value={newMeetupTime}
                      onChange={(e) => setNewMeetupTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-black rounded-xl text-xs font-mono font-bold text-black shadow-[1.5px_1.5px_0px_#000]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowMeetupEdit(false)}
                      className="px-3 py-1.5 text-xs font-mono font-bold text-ink-700 hover:text-black"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-4 py-1.5 bg-brutal-yellow text-black rounded-xl border-2 border-black text-xs font-sans font-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Save Meetup Plan
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Tracking History Log */}
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-3 shadow-brutal">
              <h3 className="font-sans font-black text-base text-black flex items-center space-x-2">
                <Clock className="w-4 h-4 stroke-[2.5]" />
                <span>Tracking History Timeline</span>
              </h3>

              <div className="divide-y-2 divide-black/10 text-xs">
                {trackingEvents.length === 0 ? (
                  <p className="py-3 text-ink-500 font-mono italic">No events recorded.</p>
                ) : (
                  trackingEvents.map((evt, idx) => (
                    <div key={idx} className="py-3 flex items-start space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-sans font-black text-black block">
                          {evt.status.replace("_", " ").toUpperCase()}
                        </span>
                        <p className="text-ink-700 font-mono text-xs mt-0.5">{evt.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions & Return (5 Cols) */}
          <div className="md:col-span-5 space-y-5">
            
            <div className="bg-white border-2 border-black rounded-2xl p-5 sm:p-6 space-y-4 shadow-brutal">
              <h3 className="font-sans font-black text-base text-black">
                Order Status Controls
              </h3>

              {order.status === "created" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("confirmed", "Payment and handover terms confirmed.")}
                  className="w-full py-3 bg-brutal-yellow hover:bg-brutal-yellow-light text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition"
                >
                  Confirm Order &amp; Agreement
                </button>
              )}

              {order.status === "meetup_scheduled" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("completed", "Item inspected and physically handed over at meetup spot.")}
                  className="w-full py-3 bg-brutal-green hover:opacity-90 text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition"
                >
                  Confirm Physical Handover Complete
                </button>
              )}

              {order.status !== "completed" && order.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => advanceOrderStatus("cancelled", "Order cancelled by student.")}
                  className="w-full py-2.5 bg-admin-50 hover:bg-admin-100 text-admin-900 border-2 border-black text-xs font-sans font-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition"
                >
                  Cancel Order
                </button>
              )}

              {/* Return Request (For Buyer if completed or issues) */}
              {isBuyer && order.status === "completed" && (
                <div className="pt-3 border-t-2 border-black/10">
                  <button
                    type="button"
                    onClick={() => setReturnModalOpen(true)}
                    className="w-full py-2 text-xs font-mono font-bold text-ink-700 hover:text-admin-700 flex items-center justify-center space-x-1.5"
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

